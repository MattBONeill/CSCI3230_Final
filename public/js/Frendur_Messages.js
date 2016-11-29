var CurrentUser = null;


$(document).ready(function(){
	$.ajax({url:'/Messages', type:'Post', success: function(results){
		var friends = ""
		for(var cnt in results)
			friends += makeFriend(results[cnt]);
		$('.M_Friends_List').append(friends);
		$('.M_Friend').click(onFriendClick);
	}});


	$('form').submit(function(temp){
		console.log(temp)
		SendText();
		return false;
	});

	$('textarea').keypress(function(event) {

	    if (event.keyCode == 13) {
	        SendText();
    	}
	});

	setInterval(refreshMessages, 1000);
});




function refreshMessages()
{
	$.ajax({url:'/Messages?username='+CurrentUser, type:'Post', success: function(results){
		if(Object.keys(results).length > 0)
		{
			var messages_text = "";
			console.log(results);
			for(var cnt in results)
			{
				messages_text += makeMessage(results[cnt].user, results[cnt].text, results[cnt].isUser);
			}
			$('.M_Messages_List').html("");
			$('.M_Messages_List').append(messages_text);
			ScrollPage();
		}
	}});
}

function SendText()
{
	if(CurrentUser)
	{
		if(checkTextToSend($('textarea').val()))
		{	
			$.ajax({url:'/Messages/Send', type:'Post', data: {username: CurrentUser, text: $('textarea').val(), timeSent: new Date().getTime()}});
			$('textarea').val('');
			refreshMessages();
		}
	}
}

function ScrollPage()
{
	$('.M_Messages_List').animate({ scrollTop: $(".M_Messages_List").height()}, 1000);
}

function onFriendClick(event)
{
	var username = $(event.currentTarget).find('span').text();
	CurrentUser = username;
	refreshMessages();
}


function makeFriend(username)
{
	return '<div class="M_Friend"><img src="/Profile/image?username='+username+'"><span>'+username+'</span></div>';
}


function makeMessage(username, text, isUser)
{
	var message_text = ""

	if(isUser)
	{
		message_text += '<div class="M_Message_R">' + makeMessageText(text) + makeMessageImage(username) + '</div>';
	}
	else
	{
		message_text += '<div class="M_Message_L">' + makeMessageImage(username) + makeMessageText(text) + '</div>';
	}
	return message_text;
}


function makeMessageImage(username)
{
	return '<img class="M_M_Image" src="/Profile/image?username='+username+'">';
}

function makeMessageText(text)
{
	return '<span class="M_M_Text">'+text+'</span>';
}
