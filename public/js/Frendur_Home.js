$(document).ready(function(){

	var cnt;
	for(cnt = 0; cnt < 8; cnt++)
		$('.content').append(makePost("Sumnut", "This is a dynamic Post Text: " + cnt, [{username: 'Sumnut', text: "This is a dynaimc Comment Test: " + cnt}]));
});