function insert_text_after(elem,text)
{
  var newelem = document.createElement('p');
  newelem.innerHTML = text;
  $(elem).after(newelem);

  return newelem;
}

function insert_link_after(elem,text,url)
{
  var newelem = document.createElement('a');
  newelem.text = text;
  newelem.href = url;
  $(elem).after(newelem);

  return newelem;
}

/*
function delete_by_ID(ID)
{
  var adSidebar = document.getElementById(ID);
  if (adSidebar) { adSidebar.parentNode.removeChild(adSidebar); }
}
*/

function make_spoiler(jelem,text)
{
  var sp = document.createElement('div');
  $(jelem).before(sp);
  var element = $(jelem).detach();
  $(sp).append(element);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = text;

  $(btn).click(function()
  {
    $(sp).toggle();
  });

  $(sp).before(btn);
  $(sp).hide();

  return sp;
}
