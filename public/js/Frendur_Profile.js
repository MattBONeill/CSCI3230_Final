$(document).ready(function(){

	var cnt;
	for(cnt = 1; cnt < 9; cnt++)
		$('.P_C_Posts').append(makePost("Sumnut", "This is a dynamic Post Text: " + cnt, [{username: 'Sumnut', text: "This is a dynaimc Comment Test: " + cnt}]));
});