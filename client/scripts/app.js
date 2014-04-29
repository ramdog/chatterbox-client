var app = {
  currentRoom: undefined, //initialize with no room
  roomList: {all: true},
  init: function() {
    var queryString = window.location.search;
    var username = queryString.substring(queryString.indexOf("=") + 1);
    this.refresh();
    $('#input').on('submit', function(event) {
      event.preventDefault();
      var $message = $('#chat_message');

      app.send({
        text: $message.val(),
        username: username,
        roomname: app.currentRoom === undefined || app.currentRoom === "all" ? "" : app.currentRoom
      });
      $message.val("");
      app.fetch();
    });

    var $roomSelect = $('#roomselect');
    $roomSelect.on('change' , function(event) {
      event.preventDefault();
      app.currentRoom = $roomSelect.val();
    });

  },
  send: function(message) {
    $.ajax({
      url: 'https://api.parse.com/1/classes/chatterbox',
      type: 'POST',
      data: JSON.stringify(message),
      contentType: 'application/json',
      success: function (data) {
        console.log('chatterbox: Message sent');
      },
      error: function (data) {
        console.error('chatterbox: Failed to send message');
      }
    });
  },
  refreshRooms: function() {
    var data = {order: '-createdAt'};
    $.ajax({
      url: 'https://api.parse.com/1/classes/chatterbox',
      type: 'GET',
      contentType: 'application/json',
      data: data,
      success: function (data) {
        var rooms = {};
        for (var i = 0; i < data.results.length; i++) {
          rooms[_.escape(data.results[i].roomname)] = true;
        }

        for (room in rooms) {
          if (app.roomList[room] === undefined) {
            app.roomList[room] = true;
            $('#roomselect').append('<option value="' + room + '">' + room + '</option>');
          }
        }
      }
    });
  },
  fetch: function(roomname) {
    var data = {order: '-createdAt'};
    if (roomname !== undefined && roomname !== 'all') {
      data.where = {roomname: roomname};
    }

    $.ajax({
      url: 'https://api.parse.com/1/classes/chatterbox',
      type: 'GET',
      contentType: 'application/json',
      data: data,
      success: function (data) {

        $("#chats").empty();
        var results = data.results.slice(0,5).reverse();

        // <div class='updated_at'>" + _.escape(message.updatedAt) + "</div>\
        _.each(results, function(message) {
          $("#chats").append(
            "<div class='chat'>\
              <div class='username'>" + _.escape(message.username) + "</div>\
              <div class='updated_at'>" + _.escape(message.updatedAt) + "</div>\
              <div class='roomname'>" + _.escape(message.roomname) + "</div>\
              <div class='message'>" + _.escape(message.text) + "</div>\
            </div>");
        });
      },

      error: function (data) {
        // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.error('chatterbox: Failed to fetch messages');
      }
    });
  },

  _refreshInternal: function() {
    app.fetch(app.currentRoom);
    app.refreshRooms();
  },
  refresh: function() {
    app.fetch();
    setInterval(app._refreshInternal, 1000);
  }
};

/**
 * createdAt: "2013-10-07T16:22:03.280Z"
objectId: "teDOY3Rnpe"
roomname: "lobby"
text: "hello"
updatedAt: "2013-10-07T16:22:03.280Z"
username: "gary"
 */
