var Pricing = function() {
  return {
    init: function() {
      $('.table-pricing')
        .on('mouseenter', function() {
          $(this).addClass('table-featured');
        })
        .on('mouseleave', function() {
          $(this).removeClass('table-featured');
        });
    }
  };
}();
