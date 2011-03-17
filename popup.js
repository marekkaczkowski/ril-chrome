var bgPage = chrome.extension.getBackgroundPage();
function init(){
    if(!localStorage["iwillril_updating"])    
    {
        bgPage.update_loop();
        localStorage["iwillril_updating"] = 'true';
    }
    setTimeout("build_page()", 1);
}
	  
function build_page(){

    var items = get_items_per_page();
	
	if(items > 5){
        document.getElementById("list_div").style.overflow = "auto";
	}

	if(!localStorage["ril_mylist_array"]){
        if((localStorage["rilName"]  && localStorage["rilPassword"])){
	        bgPage.is_authenticate(callback_empty_list_check);
        }else{	
	        document.getElementById("table_list").innerHTML = "<tr class='list_msg' style=\"text-align:center; height: 200px\"><td class='no_border' style=\"font-size:20px;\">Please Configure The IWillRil in the Option page</td></tr>";
        }
	}	
	else{
	    update_page(1);
	}		
}


function callback_empty_list_check(resp){
	var list = "";
	if(resp == "200 OK"){
        show_load_screen();
        list = "<tr id=\"auth_failed\" class='list_msg' style=\"text-align:center; height: 200px\" ><td class='no_border' style=\"font-size:20px;\"><img src='build_list_loader.gif'></gif></td></tr>";
        document.getElementById('table_list').innerHTML = list;
        build_list();
	}
	else{
        list = "<tr id=\"auth_failed\" class='list_msg' style=\"text-align:center; height: 200px\" ><td class='no_border' style=\"font-size:20px;\">Authentication Failed!! Resp Code" + resp +"</td></tr>";
        document.getElementById('table_list').innerHTML = list;
	}	
}

function build_favicons(){
    if(localStorage["favicons"]){
        var favicons = localStorage["favicons"].split("||||");	  
        for(var i = 0; i < favicons.length; i++){
            change_img("favicon_index_"+i, favicons[i]);
        }
	}  
}
	  
function add(){
	show_load_icon();
	if(get_items_per_page() > get_uncount_number()){
	    if(document.getElementById("all_msg_read"))
	        document.getElementById("table_list").innerHTML = "";

        document.getElementById("table_list").innerHTML += "<tr  id='load_td' ><td class=\"no_border\"><br></td><td><label id='loading'>Loading</label><img src='loader_table.gif'></img></td><td class=\"no_border\"></td></tr>" 
        document.getElementById("load_td").opacity = 0.4;
	}
  	document.getElementById("add_img").src = "bookmark_press.png";
	chrome.tabs.getSelected(null, function(tab) {
	    var url = tab.url;
	    var title = tab.title;
	    _add(url,title);        
	});
}

function _add(url, title){
	bgPage.add(callback_add, url, title);	
}

function callback_add(resp){
    build_list();
}

function get_actual_page(){
	if(document.getElementById('page_slc') && !isNaN(document.getElementById('page_slc').value))
        return document.getElementById('page_slc').value;
	return 1;	
}
	
function mark_as_read(url, id){
	change_list_elem_style(id);
	var array = new Array();
	array[0] = url;
	bgPage.send(callback_mark_as_read, array);
}

function callback_mark_as_read(url){	
	build_list();
}

function show_load_screen(){
	document.getElementById("list_div").style.opacity = 0.4;
}

function hide_load_screen(){
	document.getElementById("list_div").style.opacity = 1;
}

function change_list_elem_style(id){	
    document.getElementById("img_line_index"+id).src = "uncheck.png";
    var elem = document.getElementById("line_index_"+id);
	elem.style.opacity = 0.3;
	elem.style.textDecoration = "line-through";
}
	
function load_mylist(){
  	document.getElementById("refresh_img").src = "refresh_press.png";
	show_load_screen();
	build_list();
}

function change_title_style(id, style){
	if(style == 'on')
        document.getElementById('title_span_index_'+id).style.textDecoration = "underline";
	else
        document.getElementById('title_span_index_'+id).style.textDecoration = "none";
}	

function build_list(){	
	bgPage.get(callback_get, get_last_get_time());
}


function parse_list(list_s){	
	var list_obj = JSON.parse(list_s);	
	return list_obj;
}

function callback_get(resp){
    bgPage.update_content(resp);    
	update_page();
}

function update_page(page){
    build_content(page);
	build_footer();
	build_favicons();
	refresh_screen();    
}

function refresh_screen(){	
	hide_load_screen();
	hide_load_icon();	
	change_img("refresh_img", "refresh.png");
	change_img("add_img", "bookmark.png");
}

//TODO -> melhorar a lógica de itens_per page
function build_content(page){
    page = parseInt(page);
    if(!page)    
        page = 1;
    
    var list_content = "";
    if(localStorage["ril_mylist_array"]){    
        var list_array = localStorage["ril_mylist_array"].split("||||");        
        
        localStorage["uncount_number"] = list_array.length;
        
        var items = get_items_per_page();
                
        var index = (page - 1) * items;
        
        if(index == list_array.length){
            --page;
            index -= items;                	
            document.getElementById('page_slc').value = page;
        }
        
        var limit = items * page;
        if(list_array.length > index){
	        for(index; index < limit && index < list_array.length; index++){
	            list_content += list_array[index];
	        }
        }
        
        localStorage["ril_mylist"] = list_content;

    }else{
	    localStorage["ril_mylist"]  = "";
	    list_content = "<tr id=\"all_msg_read\" class='list_msg' style=\"text-align:center; height: 200px\"><td class='no_border' style=\"font-size:20px;\">Congratulations!! You already read all yours items</td></tr>";
	}
	document.getElementById("table_list").innerHTML = list_content;	
}

function build_footer(){
	set_footer_msg();
	set_footer_slc();
}

function set_footer_msg(){
	var uncount = localStorage["uncount_number"];
	var footer_msg = "I have nothing to read!!!";
	if(uncount && uncount > 0)
        footer_msg = "I will read "+uncount+" items Later!!!"
	document.getElementById("footer_msg").innerHTML = footer_msg;	
}

function set_footer_slc(){
	var options_number = get_uncount_number() / get_items_per_page();	
	
	if(options_number == 0)
        options_number = 1;
	
	var options = "";
	
	for(var i = 0; i < options_number; i++){
        var page = get_actual_page();
        var item = i + 1;	
        var selected = page == item ? " selected "	: "";
        options += "<option "+selected+" value='"+item+"'>"+item+"</option>";
	}
	var select = "<label id=\"select_text\">Page: </label><select id='page_slc' onchange='change_page(this.value)'>"+ options + "</select>";
	document.getElementById("pagination").innerHTML = select;
}

function change_page(page){
	show_load_screen();
	update_page(page);
}

function get_items_per_page(){
	if(localStorage["ril_items_per_page"])
        return parseInt(localStorage["ril_items_per_page"]);
	return 5;	
}

function get_uncount_number(){
	if(localStorage["uncount_number"]){
        return localStorage["uncount_number"];
	}
	return 0;
}

function get_last_get_time(){
    return 0;

	if(localStorage["last_get_time_iwillril"]){
        var time =	localStorage["last_get_time_iwillril"];
        localStorage["last_get_time_iwillril"] = get_unix_time();                
        return time;
	}
	
	localStorage["last_get_time_iwillril"] = get_unix_time();
	return 0;
}

function change_img(id, img){
	if(document.getElementById(id))
        document.getElementById(id).src = img;
}

function show_load_icon(){
    document.getElementById("status_img").style.visibility = 'visible';
}

function hide_load_icon(){
    document.getElementById("status_img").style.visibility = 'hidden';
}

function get_unix_time(){
	var foo = new Date();
	var unixtime_ms = foo.getTime();
	var unixtime = parseInt(unixtime_ms / 1000);
	return unixtime;
}