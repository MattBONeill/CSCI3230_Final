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
});

function SendText()
{
	if(CurrentUser)
	{
		$.ajax({url:'/Messages/Send', type:'Post', data: {username: CurrentUser, text: $('textarea').val(), timeSent: new Date().getTime()}});
		$('textarea').val('');
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
	$.ajax({url:'/Messages?username='+username, type:'Post', success: function(results){
		console.log(results);

		if(Object.keys(results).length > 0)
		{
			var messages_text = "";
			for(var cnt in results)
			{
				messages_text += makeMessage((results[cnt].isUser)? "Sumnut":username, results[cnt].text, results[cnt].isUser);
			}
			console.log(messages_text);
			$('.M_Messages_List').append(messages_text);
		}

	}});
}


function makeFriend(username)
{
	return '<div class="M_Friend"><img src="/Profile/image?username='+username+'" /><span>'+username+'</span></div>';
}

function makeMessage(username, text, isUser)
{
	var userClass;
	if(isUser)
		userClass = "M_Message_R";
	else
		userClass = "M_Message_L";

	var message_text = '<div class="'+userClass+'">'
	if(isUser)
		message_text += makeMessageText(text) + makeMessageImage(username);
	else
		message_text += makeMessageImage(username) + makeMessageText(text);
	message_text += '</div>';
	return message_text;
}

function makeMessageImage(username)
{
	return '<img class="M_M_Image" src="/Profile/image?username='+username+'" />';
}

function makeMessageText(text)
{
	return '<span class="M_M_Text">'+text+'</span>';
}

