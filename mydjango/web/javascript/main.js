$(document).ready
(
    function()
    {
        
        var main_header       = $('#main_header_wrapper'),
            scroll_top_button = $('#scroll_top_button');
    
        main_header.hover
        (
            function()
            {
                main_header.removeClass('onscroll');
            },
            function()
            {
                if ($(document).scrollTop() != 0) {
                    main_header.addClass('onscroll');
                }
            }
        );
        $(window).scroll
        (
            function()
            {
                main_header.add(scroll_top_button).addClass('onscroll');
                if ($(document).scrollTop() == 0) {
                    main_header.add(scroll_top_button).removeClass('onscroll');
                }
            }
        );
        scroll_top_button.click
        (
            function(event)
            {
                event.preventDefault();
                $('html, body').animate({ scrollTop: 0 }, 600);
            }
        );

    }
);