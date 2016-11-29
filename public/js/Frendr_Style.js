function makePost(username, text, comments, id)
{
	var post = '<div class="frendr_post"><div class="post_header"><div class="post_head"><img src="/Profile/image?username='+username+'"><a class="post_head_username" href="/Profile?username='+username+'"> '+username+ '</a></div><div class="post_text">'+text+'</div></div><div class="post_comments"><div class="post_id" style="display:none">'+id+'</div>' + makeComments(comments) + '</div></div>';
	return post;
}

function makeComments(comments)
{
	var Comments_text = "";
	var comment;
	for(comment in comments)
	{
		Comments_text += makeAComment(comments[comment]);
	}
	return Comments_text;
}

function makeAComment(comment)
{
	var comment_text = '<div class="frendr_comment"><div class="f_c_image"><img class="frendr_comment_img" src="/Profile/image?username='+comment.userID+'"></div><div class="f_c_text"><a class="comment_username" href="/Profile?username='+comment.userID+'"> '+comment.userID+'</a><span>'+comment.text+'</span></div></div>';
	return comment_text;
}

function DisplayPosts(posts, comments, PostArea)
{
	$('.frendr_post').remove();
	for(var cnt in posts){
		var post = posts[cnt];
		$(PostArea).append(makePost(post.userID, post.text, comments[post._id], post._id));
	}
}

function checkTextToSend(text)
{
    if(text.match(/[\s]+$/) || text === ''){
    	console.log(text);
        return false;
    }
    else
        return true;
}

function refreshPosts(url, DisplayArea)
{
	$.ajax({url:url, type:'Post', success: function(results){
		DisplayPosts(results.posts, results.comments, DisplayArea);
		$('.frendr_post').click(onCommentClick);
	}});
}

function SendComment()
{
	var text = $('#comment_bar').find('input').val();
	if(checkTextToSend(text))
	{	
		$.ajax({url:'/Posts/Comment', type:'Post', data: { postID: $('#comment_bar').parent().find('.post_id').text() , text: text, timeSent: Number(new Date().getTime())}});
		$('#comment_bar').remove();
		setTimeout(function() {PostRefresh();}, 100);
	}
	return false;
}

function onCommentClick(event)
{
	//remove previous comment bar, make sure all post have onclick avaiable
	$('#comment_bar').remove();
	$('.frendr_post').click(onCommentClick);

	//get the current item, remove the onclick function, and find the post section
	var comment = $(event.currentTarget);
	comment.prop('onclick',null).off('click');
	var CommentArea = comment.find('.post_comments');

	//add a form and input bar
	var text = '<form id="comment_bar"><img class="frendr_comment_img" src="/Profile/my_image"><input></form>';
	CommentArea.append(text);
	//override the onsubmit function
	$('#comment_bar').submit(SendComment);
}
