function makePost(username, text, comments)
{
	var post = '<div class="frendr_post"><div class="post_header"><div class="post_head"><img src="/Profile/image?username='+username+'"><a class="post_head_username" href="/Profile?username='+username+'"> '+username+ '</a></div><div class="post_text">'+text+'</div></div><div class="post_comments">' + makeComments(comments) + '</div></div>';
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
	var comment_text = '<div class="frendr_comment"><div class="f_c_image"><img class="frendr_comment_img" src="/Profile/image?username='+comment.username+'"></div><div class="f_c_text"><a class="comment_username" href="/Profile?username='+comment.username+'"> '+comment.username+'</a><span>'+comment.text+'</span></div></div>';
	return comment_text;
}