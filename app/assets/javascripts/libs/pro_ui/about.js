var About = function() {
  return {
    init: function() {
      $('.media-map').css('height', $('.site-section-top').outerHeight() + 50);
      new GMaps({
        div: '#gmap-top',
        lat: -33.870,
        lng: 151.22,
        zoom: 15,
        disableDefaultUI: true,
        scrollwheel: false
      }).setMapTypeId(google.maps.MapTypeId.SATELLITE);
    }
  };
}();
