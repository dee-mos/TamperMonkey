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
    
// hide text of article    
$('article div.entry').hide();

hdr = $('#theme-header');
    
$('<input />', { type: 'checkbox', id: 'show_hide_entry', class: 'trigger_show_entry' }).appendTo(hdr);  
$('<label />', { text: 'Show/Hide' }).appendTo(hdr);    
$('#show_hide_entry').click(function() { $('article div.entry').toggle(); });     
    
$("a.more-link").each(function(index)
{
	//console.log($(this).prop('href'));
    last_span = $(this).closest('article').find('span:last');
	new_span = last_span.clone().addClass('new_messages_counter').text('');
	last_span.after(new_span);

    $.ajax({
      url: $(this).prop('href'),
	  counter_elem: new_span,
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
		  if(new_count > 0) { this.counter_elem.text('Новых: ' + new_count); } else { this.counter_elem.hide(); }
	  }
	}
  });

});

//============================================================================================================================================    

my_name = GM_getValue('dom2novosti_user_name', 'KPOBOCOC');	
	
// insert checkbox to hide/show articles    
hdr = $('#theme-header');
$('<input />', { type: 'checkbox', id: 'show_hide_articles', value: name }).appendTo(hdr);  
$('<label />', { 'for': 'show_hide_articles', text: 'Show/Hide articles' }).appendTo(hdr);    
    
post_id = get_post_id();

//console.log("post_id = " + post_id );

last_msg = dt.str2datetime( GM_getValue(post_id, null) ) ;

maxDate = new Date(1500,1,1);

var gradient = make_gradient('#2FD9FB', '#FAD1D1', 10);

comments = $('div#comments li');
comments.each(set_comment_attributes);

$("cite").each(function( index )
{
    cur_msg_datetime = dt.str2datetime($(this).next().text());
    diff = (Date.now() - cur_msg_datetime) / (1000 * 60 * 60); // in hours
    diffh = Math.trunc(diff);

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

/**********
my_messages = $("cite").filter( function(index) { return my_name == $(this).text(); } );
my_messages.css({'color' : 'red', 'font-weight':'bold'}).closest( "li" ).find( "*" ).css( "background-color", "#b9ffd5" );

new_messages = $("cite").filter( function(index) { msg_date = add_date_time( $(this).next().text() ); return msg_date > last_msg; } );
new_messages.css({'color' : 'red', 'font-weight':'bold'}).closest( "li" ).find( "*" ).css( "background-color", "#fdff8d" );
***********/

max_date_str = dt.strftime('%d.%m.%Y at %H:%M',maxDate);

GM_setValue(post_id, max_date_str);

$('body').show();
}

//=======================================================================================================================================

console.log('window.location.pathname = ' + window.location.pathname);
console.log('window.location.href = ' + window.location.href);

// '/' or '/page/3/'
is_root_page = (window.location.pathname == '/');
is_page = is_root_page || (window.location.pathname.match(/^\/page\/\d+\/$/) !== null);

GM_addStyle("div.header { display: none !important; }");
GM_addStyle("::-webkit-scrollbar {width: 24px;height:8px;}");

GM_addStyle( GM_getResourceText ("animated_css") );
GM_addStyle( GM_getResourceText ("animation2_css") );
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
	  get_articles(a1[0]).each(function(index) { $('article:last').after($(this)); } );
	  get_articles(a2[0]).each(function(index) { $('article:last').after($(this)); } );
	  get_articles(a3[0]).each(function(index) { $('article:last').after($(this)); } );
	  get_articles(a4[0]).each(function(index) { $('article:last').after($(this)); } );

	  //posting = $("#main-content > div.content-wrap > div > div.post-listing");
	  //posting.hide();
      /*
	  articles.each(function(index)
	  {
		art_title = $('h2:first', $(this));
		$(this).find('.more-link').remove();

		posting.after($(this));

	  });
	  */

	  process_page();
	});
}
else
	process_page();


