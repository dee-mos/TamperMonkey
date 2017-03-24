// ==UserScript==
// @name         dom2novosti
// @namespace    DeeTamper
// @version      0.1
// @description  dom2novosti
// @author       Dee
// @match        http://*.dom2novosti.ru/*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js
// @require      https://raw.githubusercontent.com/dee-mos/TamperMonkey/master/libs/datetime.js
// @require      https://raw.githubusercontent.com/dee-mos/TamperMonkey/master/libs/dom.js
// @require      https://raw.githubusercontent.com/dee-mos/TamperMonkey/master/libs/KolorWheel.min.js
// @resource     controls_css    https://raw.githubusercontent.com/dee-mos/TamperMonkey/master/css/controls.css
// @resource     animated_css    https://raw.githubusercontent.com/dee-mos/TamperMonkey/master/css/animated.css
// @resource     animation2_css  https://raw.githubusercontent.com/dee-mos/TamperMonkey/master/css/animation2.css
// @resource     common_css      https://raw.githubusercontent.com/dee-mos/TamperMonkey/master/css/common.css
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_getResourceURL
// @grant        GM_getResourceText
// ==/UserScript==

//debugger;

$.getUrlParam = function(param)
{
  var results = new RegExp('[\?&]' + param + '=([^&#]*)').exec(window.location.href);
  if (results!=null && results[1]) 
  {
    return decodeURIComponent(results[1]);
  }
  return null;
}

if (typeof jQuery.when.all === 'undefined') 
{
    jQuery.when.all = function (deferreds) {
        return $.Deferred(function (def) {
            $.when.apply(jQuery, deferreds).then(
                function () {
                    def.resolveWith(this, [Array.prototype.slice.call(arguments)]);
                },
                function () {
                    def.rejectWith(this, [Array.prototype.slice.call(arguments)]);
                });
        });
    }
}

function add_date_time(datetimestring)
{
  var dateObject = dt.str2datetime(datetimestring);
  if(dateObject > maxDate)
      maxDate = dateObject;
  //console.log( dateObject );
  return dateObject;
}

function HideShow()
{
	el = document.getElementById('spoiler_header');
	if(el.style.display=='none') {el.style.display='';}else{el.style.display='none';}
}

function get_post_id()
{
  classes = $("body").prop("classList");
  for(var i=0; i<classes.length; ++i) {
      if( classes[i].match(/^postid-(\d+)$/) )
      {
        return 'postid-' + RegExp.$1;
      }
  }
  return null;
}

function make_gradient(start, end, steps)
{
  var base = new KolorWheel(start);
  var target = base.abs(end, steps);
  var res = [];
  for (var n = 0; n < steps; n++) { res.push( target.get(n).getHex() ); }
  return res;
}

function set_comment_attributes(index, element)
{
  author = $('cite:first', element).text().trim();
  $(element).attr('author',author);
  if(my_name == author) $(element).attr('my_name',1);
  timestamp = $('div.comment-meta:first a', element).text().trim();
  $(element).attr('timestamp',timestamp);
}

function get_page(page_url)
{
  return $.ajax( { url: page_url } );
}

function get_articles(response)
{
  return $('<html />').html(response).find('article');
}

function parse_page(jarticles) /* =============================================================================================================== */
{
    console.log('parsing page...');
    
    $("article").each(function(index)
    {
        // minimize main page
	messages_count = $(this).find('span.post-comments').text();
	$(this).css( {'margin-bottom': '2px', 'overflow': 'hidden' } );    
	$(this).find('span').remove();
	$(this).find('p.post-meta').remove();    
    $(this).find("div.entry").before($(this).find('h2'));
	    
	// make a code around image:  <span id="mouseOver"><img src="http://placekitten.com/120/120"></span>
        //$(this).find('div.post-thumbnail > a').wrap('<span class="mouseImageZoomOver"></span>');
        $(this).css('background-color','#cccccc');
        
        $(this).find('h2 > a').attr('target','_blank');

    	//console.log($(this).prop('href'));
        $.ajax({
            url: $(this).find('h2 > a').prop('href'),
    	    article_elem: $(this),
            success: function( data )
            {
                new_count = 0;
                min_diff = 0;	
                has_my_name = 0;
                if( data.match(/<link rel='shortlink' href='http:\/\/dom2novosti.ru\/\?p=(\d+)' \/>/gi) )
                {
                    post_id = RegExp.$1;
                    if( data.match(/(<div id="comments">[\s\S]*?)<!-- #comments -->/gim) )
                    {
                        comments = $('li', $(RegExp.$1));
                        comments.each(set_comment_attributes);
                        last_msg = dt.str2datetime( GM_getValue('postid-'+post_id, null) );
                        console.log("[-] post_id = " + post_id );    
                        console.log("[-] last_msg = " + last_msg );    
                        comments.each(function(index)
                        {
                            datetime = dt.str2datetime( $(this).attr('timestamp') );
                            if($(this).attr('my_name') == 1) has_my_name++;
                            if(datetime > last_msg) 
                            {
                                new_count++;
                                if(datetime - last_msg < min_diff) { min_diff = datetime - last_msg; }
                            }
                        });
                    }
                    
                    $(this).attr('new_messages',new_count);
                    if(new_count > 0) { 
                        this.article_elem.css('background-color','#c4ffeb'); 
                        this.article_elem.attr('new_msg_count', new_count);      
                        this.article_elem.attr('min_time_diff', min_diff);
                        this.article_elem.prepend(
                            $('<div />', { style: 'float: right; background-color: ' + (has_my_name ? '#ffc290' : '#9fe1ff') + '; width: 24px; margin-bottom: -99999px; padding-bottom: 99999px; text-align: center;' } ).text(new_count)
                        );
                    } else { 
                        this.article_elem.css('background-color','');
                    } 
                  
                } // if( data.match
    	    }// success
        });
    });
}

function parse_article() /* =============================================================================================================== */
{
    console.log('parsing article...');
    
    post_id = get_post_id();
    last_msg = dt.str2datetime( GM_getValue(post_id, null) ) ;
    console.log("[A] post_id = " + post_id );    
    console.log("[A] last_msg = " + last_msg );    

    maxDate = new Date(1500,1,1);

    gradient_steps = 12;	
    var gradient = make_gradient('#2FD9FB', '#FAD1D1', gradient_steps);

    $('.commentlist .children').css('margin-top', '0');
	
    $('div#comments li').each(function(index)
    {
        set_comment_attributes(index, this);

        $(this).css('margin-bottom', '4px');

        cite_elem = $('cite:first', $(this));
        timestamp = $(this).attr('timestamp');
        author = $(this).attr('author');
        diffh = Math.trunc( (Date.now() - dt.str2datetime(timestamp)) / (1000 * 60 * 60) ); // in hours
        msg_date = add_date_time( timestamp ); // updates maxDate
        
        console.log(timestamp, author, msg_date, msg_date - last_msg);
        
        elem_ava = $(this).find('div.comment-avatar:first');
        if(diffh >= 0 && diffh < gradient.length) {  cite_elem.css({'font-weight':'bold'}).closest( "li" ).find( "*" ).css( "background-color", gradient[diffh] );  }
        if(my_name == author)
        {
          cite_elem.css({'color' : 'red', 'font-weight':'bold'}).closest( "li" ).find( "*" ).css( "background-color", "#b9ffd5" );
        }

        if( msg_date > last_msg ) { elem_ava.css( "background-color", "#fdff8d"); elem_ava.addClass('animation_01'); } else { elem_ava.hide(); }
    });
	
    $('ul.children').css('background-color', '');
    $('div#comments li').css('background-color', '');

    max_date_str = dt.strftime('%d.%m.%Y at %H:%M',maxDate);

    GM_setValue(post_id, max_date_str);
}

function process_page()
{
    $("body").css("cssText", "background-image: none !important;");

    //<link rel="shortcut icon" href="http://dom2novosti.ru/wp-content/uploads/2016/11/favicon.ico" title="Favicon" /><!--[if IE]>    
    //$('link[title="Favicon"]').attr("href","http://www.stackoverflow.com/favicon.ico");
        
    $("#categories-4").remove();
    $("#recent-posts-2").remove();
    $("div.logo").remove();
    $("#theme-header > div").remove();
    $("footer").remove();
    $("div.footer-bottom").remove();
    $("div.post-navigation").remove();
    
    $('.item-list').css('padding','0 0');
	
    $(".content").width("800");

    $("#main-nav").css("cssText", "background-color: black !important;");

    $("span.comment-author-link.cwp-author-link").filter( function(index) { return my_name == $(this).text(); } ).css( "color", "red" );

    $("img.attachment-tie-large.size-tie-large.wp-post-image").width(100);

    $('article a.more-link').hide();

    $('.post-title').addClass('post-title-new').removeClass('post-title');

    $('.comment-avatar').css( {'width' : '20px', 'height':'20px'});

    $('#theme-header').remove();

    // new form on top
    hdr = $('div.wrapper > div.container').prepend( 
        $('<div />',    { class: 'd2topmenu', id: 'options_form' } ) );
    $('#options_form').prepend(
        $('<a />',      { href: 'http://dom2novosti.ru/', text: 'Главная' }),
        $('<span />'),
        $('<input />',  { type: 'checkbox', id: 'cfg_show_hide_articles', value: name }), // class: 'gcheckbox',
        $('<label />',  { text: 'Show/Hide articles' }),
        $('<span />'),
        $('<label />',  { text: 'Name:' }),
        $('<input />',  { type: 'text', id: 'cfg_my_name', value: name }),
        $('<button />', { id: 'btn_menu_ok', text: 'OK' })
    );    

    GM_addStyle(".ginput { all: initial; * { all: unset; } }" );

    $('#cfg_my_name').val(my_name);
    $('#cfg_show_hide_articles').click(function() { $('article div.entry').toggle(); });     
    $("#btn_menu_ok").click( function() { GM_setValue('dom2novosti_user_name',$('#cfg_my_name').val() ); } );

    // hide text of article    
    if(!is_root_page) $('article div.entry').hide();

    if(is_page) 
        parse_page( $("article") );
    else if (is_article)
        parse_article();
        
    document.body.onmousedown = undefined;
    document.body.onselectstart = undefined;
	
    $('body').show();

} // function process_page()





//=======================================================================================================================================

console.log('window.location.pathname = ' + window.location.pathname);
console.log('window.location.href = ' + window.location.href);

if( $.getUrlParam('compact') == '0' ) // http://dom2novosti.ru/?compact=0
{
	$('body').show();
	return;
}	

// '/' or '/page/3/'
is_root_page = (window.location.pathname == '/');
is_page = is_root_page || (window.location.pathname.match(/^\/page\/\d+\/$/) !== null);
is_article = !is_page;

my_name = GM_getValue('dom2novosti_user_name');
console.log('My name = ' + my_name);

GM_addStyle("div.header { display: none !important; }");
GM_addStyle("::-webkit-scrollbar {width: 24px;height:8px;}");

GM_addStyle( GM_getResourceText ("animated_css") );
GM_addStyle( GM_getResourceText ("animation2_css") );
GM_addStyle( GM_getResourceText ("controls_css") );
GM_addStyle( GM_getResourceText ("common_css") );

GM_addStyle(".new_messages_counter { border-radius: 10px; background: #ff0000; padding: 2px; color: #ffffff; }");
GM_addStyle(".post-title-new { font-size: 16px; font-weight: bold; }" );

if(is_root_page)
{
  var page_loaders = [];

  root_pages_count = 5;
  root_page_template = 'http://dom2novosti.ru/page/';

  for (p = 2; p <= root_pages_count; p++) { page_loaders.push( get_page(root_page_template + p) ); }

  $.when.all( page_loaders ).then( function(objects) 
  {
    for(t in objects) { get_articles( objects[t][0]).each(function(index) { $('article:last').after($(this)); } ); }
    process_page();
  });
}
else
    process_page();

