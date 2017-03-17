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
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_getResourceURL
// @grant        GM_getResourceText
// ==/UserScript==

//debugger;

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

function set_comment_attributes(indx, element)
{
  author = $('cite:first', element).text().trim();
  $(element).attr('author',author);
  if(my_name == author) $(element).attr(my_name,1);
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

function process_page()
{
    $("body").css("cssText", "background-image: none !important;");

    //<link rel="shortcut icon" href="http://dom2novosti.ru/wp-content/uploads/2016/11/favicon.ico" title="Favicon" /><!--[if IE]>    
    $('link[title="Favicon"]').attr("href","http://www.stackoverflow.com/favicon.ico");
        
    $("#categories-4").remove();
    $("#recent-posts-2").remove();
    $("div.logo").remove();
    $("#theme-header > div").remove();
    $("footer").remove();
    $("div.footer-bottom").remove();

    $(".content").width("800");

    $("#main-nav").css("cssText", "background-color: black !important;");

    $("span.comment-author-link.cwp-author-link").filter( function(index) { return my_name == $(this).text(); } ).css( "color", "red" );

    $("img.attachment-tie-large.size-tie-large.wp-post-image").width(100);

    $('article a.more-link').hide();

    last_menu_item = $('#menu-glavnoe li:last');
    settings_menu_item = last_menu_item.clone();
    settings_menu_item.id = 'settings_menu_item';
    settings_menu_item.find('a').text('Настройки').attr('href','');
    last_menu_item.after( settings_menu_item );

    // hide text of article    
    if(!is_root_page) $('article div.entry').hide();

    hdr = $('#theme-header');
        
    $('<input />', { type: 'checkbox', id: 'show_hide_entry', class: 'trigger_show_entry' }).appendTo(hdr);  
    $('<label />', { text: 'Show/Hide' }).appendTo(hdr);    
    $('#show_hide_entry').click(function() { $('article div.entry').toggle(); });     
    
    
	
	
	
    $("article > h2 > a").each(function(index)
    {
        // minimize main page
	messages_count = $(this).find('span.post-comments').text();
	$(this).find('span').remove();
        $(this).find('div.post-thumbnail').append( $(this).find('h2') );
	    
    	//console.log($(this).prop('href'));
	article = $(this).closest('article');    
        $.ajax({
          url: $(this).prop('href'),
    	  article_elem: article,
          success: function( data )
        {
    	  new_count = 0;
          if( data.match(/<link rel='shortlink' href='http:\/\/dom2novosti.ru\/\?p=(\d+)' \/>/gi) )
    	  {
    		  post_id = RegExp.$1;
    		  if( data.match(/(<div id="comments">[\s\S]*?)<!-- #comments -->/gim) )
    		  {
                  comments = $('li', $(RegExp.$1));
                  comments.each(set_comment_attributes);
    			  last_msg = dt.str2datetime( GM_getValue('postid-'+post_id, null) );
    			  comments.each(function(index)
    			  {
    				  datetime = dt.str2datetime( $(this).attr('timestamp') );
    				  if(datetime > last_msg) new_count++;
    			  });
    		  }
		  this.article.attr('new_messages',new_count);
    	  }
    	}
      });
    });
	
    // insert checkbox to hide/show articles    
    hdr = $('#theme-header');
    $('<input />', { type: 'checkbox', id: 'show_hide_articles', class: 'gcheckbox', value: name }).appendTo(hdr);  
    $('<label />', { 'for': 'show_hide_articles', text: 'Show/Hide articles' }).appendTo(hdr);    
        
    post_id = get_post_id();

    //console.log("post_id = " + post_id );

    last_msg = dt.str2datetime( GM_getValue(post_id, null) ) ;

    maxDate = new Date(1500,1,1);

    gradient_steps = 12;	
    var gradient = make_gradient('#2FD9FB', '#FAD1D1', gradient_steps);

    comments = $('div#comments li');
    comments.each(set_comment_attributes);

    $("cite").each(function( index )
    {
        cur_msg_datetime = dt.str2datetime($(this).next().text());
        diffh = Math.trunc( (Date.now() - cur_msg_datetime) / (1000 * 60 * 60) ); // in hours

        msg_date = add_date_time( $(this).next().text() );

        elem_li = $(this).closest( "li" );
        elem_ava = elem_li.find('div.comment-avatar');

    	elem_ava.after(	$("<div class='dot'></div>") );

        if(diffh >= 0 && diffh < gradient.length) {  $(this).css({'font-weight':'bold'}).closest( "li" ).find( "*" ).css( "background-color", gradient[diffh] );  }

        if(my_name == $(this).text())
        {
          $(this).css({'color' : 'red', 'font-weight':'bold'}).closest( "li" ).find( "*" ).css( "background-color", "#b9ffd5" );
        }

        if(msg_date > last_msg)  { elem_ava.css( "background-color", "#fdff8d"); elem_ava.addClass('animation_01'); }
    });

    max_date_str = dt.strftime('%d.%m.%Y at %H:%M',maxDate);

    GM_setValue(post_id, max_date_str);

    document.body.onmousedown = undefined;
    document.body.onselectstart = undefined;
	
    $('body').show();

} // function process_page()





//=======================================================================================================================================

console.log('window.location.pathname = ' + window.location.pathname);
console.log('window.location.href = ' + window.location.href);

// '/' or '/page/3/'
is_root_page = (window.location.pathname == '/');
is_page = is_root_page || (window.location.pathname.match(/^\/page\/\d+\/$/) !== null);

my_name = GM_getValue('dom2novosti_user_name', 'KPOBOCOC');	

GM_addStyle("div.header { display: none !important; }");
GM_addStyle("::-webkit-scrollbar {width: 24px;height:8px;}");

GM_addStyle( GM_getResourceText ("animated_css") );
GM_addStyle( GM_getResourceText ("animation2_css") );
GM_addStyle( GM_getResourceText ("controls_css") );
GM_addStyle(".new_messages_counter { border-radius: 10px; background: #ff0000; padding: 2px; color: #ffffff; }");

if(is_root_page)
{
  $.when(
          get_page('http://dom2novosti.ru/page/2/'),
          get_page('http://dom2novosti.ru/page/3/'),
          get_page('http://dom2novosti.ru/page/4/'),
          get_page('http://dom2novosti.ru/page/5/')
  ).done(function(a1, a2, a3, a4)
	{
	  get_articles( a1[0]).each(function(index) { $('article:last').after($(this)); } );
	  get_articles( a2[0]).each(function(index) { $('article:last').after($(this)); } );
	  get_articles( a3[0]).each(function(index) { $('article:last').after($(this)); } );
	  get_articles( a4[0]).each(function(index) { $('article:last').after($(this)); } );

	  process_page();
	});
}
else
	process_page();


