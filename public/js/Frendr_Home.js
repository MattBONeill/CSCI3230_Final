
function PostRefresh()
{
	refreshPosts('/Posts', '.content');
}

$(document).ready(function(){
	PostRefresh();

	$('form').submit(function(temp){
		SendPost();
		return false;
	});

	$('textarea').keypress(function(event) {
	    if (event.keyCode == 13) {
	        SendPost();
    	}
	});
});

function SendPost()
{
	if(checkTextToSend($('textarea').val()))
	{	
		$.ajax({url:'/Posts/Submit', type:'Post', data: { text: $('textarea').val(), timeSent: Number(new Date().getTime())}});
		$('textarea').val('');
		setTimeout(function() {refreshPosts();}, 100);
	}
}

