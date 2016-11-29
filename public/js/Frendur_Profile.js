
$(document).ready(function(){

	PostRefresh()

	$.ajax({url:'/Profile/Friends?username=' + $('.P_B_username').find('span').text() , type:'Post', success: function(results){
		var friends = "";
		console.log(results)
		for(var cnt in results)
			friends += makeFriend(results[cnt]);
		console.log(friends);
		$('.Friends_List').append(friends);
	}});

	$('.P_B_username>button').click(addFriend);

});



function PostRefresh()
{
	refreshPosts('/Posts?username=' + $('.P_B_username').find('span').text(), '.P_C_Posts')
}



function makeFriend(username)
{
	return '<div class="P_C_Friend"><a href="/Profile?username='+username+'"><img src="/Profile/image?username='+username+'"></a><span>'+username+'</span></div>';
}

function addFriend()
{
	$.ajax({url:'/Profile/Friends/Add?username=' + $('.P_B_username').find('span').text() , type:'Post', success: function(){
		location.reload();
	}});
}