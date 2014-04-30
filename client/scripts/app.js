var app = {
  currentRoom: undefined, //initialize with no room
  friends: {},
  messagesLimit: 5,
  roomList: {all: true},
  lastMessage: undefined,
  init: function() {
    var queryString = window.location.search;
    var username = queryString.substring(queryString.indexOf('=') + 1);
    this.refresh();

    // send chat message to current room
    $('#input').on('submit', function(event) {
      event.preventDefault();
      var $message = $('#chat_message');

      app.send({
        text: $message.val(),
        username: username,
        roomname: app.currentRoom === undefined || app.currentRoom === 'all' ? '' : app.currentRoom
      });
      $message.val('');
      app._refreshInternal();
    });

    // add room (or just change if typed room already exists)
    $('#new_room').on('submit', function(event) {
      event.preventDefault();
      var newRoomName = $('#new_room_name').val();
      if (app.roomList[newRoomName] === undefined) {
        app.roomList[newRoomName] = newRoomName;
        $('#roomselect').append('<option value="' + newRoomName + '">' + newRoomName + '</option>');
      }
      app.currentRoom = newRoomName;
      app._refreshInternal();
      $('#roomselect').val(newRoomName).trigger('change');
      $('#new_room_name').val('');
    });

    // change rooms (user selects from dropdown)
    var $roomSelect = $('#roomselect');
    $roomSelect.on('change' , function(event) {
      event.preventDefault();
      app.currentRoom = $roomSelect.val();
      app._refreshInternal();
    });

    // click username to friend and highlight messages
    $('#chats').on('click', '.username', function(event) {
      event.preventDefault();
      var friend = $(this).text();
      if (app.friends[friend] === undefined) {
        app.friends[friend] = true;
      } else {
        delete app.friends[friend];
      }
      app.applyFriendsProperties();
    });

  },

  makeAjaxCall: function(type, successCallBack, errorCallBack, data) {
    var ajaxObject =  {
      url : 'https://api.parse.com/1/classes/chatterbox',
      contentType: 'application/json',
      type: type
    };
    if (data !== undefined) {
      ajaxObject['data'] = data;
    }
    if (successCallBack !== undefined) {
      ajaxObject['success'] = successCallBack;
    }
    if (errorCallBack !== undefined) {
      ajaxObject['error'] = errorCallBack;
    }
    $.ajax(ajaxObject);
  },

  send: function(message) {
    var success = function() {console.log('chatterbox: Message sent');};
    var error = function() {console.error('chatterbox: Failed to send message');};
    app.makeAjaxCall('POST', success, error, JSON.stringify(message));
  },

  refreshRooms: function() {
    var data = {order: '-createdAt'};
    var success = function (data) {
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
      };
    app.makeAjaxCall('GET', success, undefined, data);
  },

  renderMessage: function(messages) {
    var $chats = $('#chats');

    var nbMsgOnPage = $chats.children().length;
    var nbMsgNew = messages.length;
    var nbMsgToRemove = Math.max(nbMsgOnPage + nbMsgNew - app.messagesLimit, 0);

    while(nbMsgToRemove){
      $chats.find('.chat:first').remove();
      --nbMsgToRemove;
    }

    _.each(messages, function(message) {
      $('#chats').append(
        "<div class='chat'>\
          <div class='username'>" + _.escape(message.username) + "</div>\
          <div class='updated_at'>" + _.escape(message.updatedAt) + "</div>\
          <div class='roomname'>" + _.escape(message.roomname) + "</div>\
          <div class='message'>" + _.escape(message.text) + "</div>\
        </div>");
    });
  },

  fetch: function(roomname) {
    var data = {order: '-createdAt', limit: app.messagesLimit, where: {}};
    if (roomname !== undefined && roomname !== 'all') {
      data.where['roomname'] = roomname;
    }
    if (app.lastMessage !== undefined) {
      data.where['createdAt'] = {"$gt": {"__type":"Date", "iso":app.lastMessage}};
    }
    var success = function (data) {
      app.renderMessage(data.results.reverse());
    };
    var error = function (data) {
        console.error('chatterbox: Failed to fetch messages ' + data.responseText);
    };
    app.makeAjaxCall('GET', success, error, data);
  },

  applyFriendsProperties: function() {
    var $displayedChats = $('.chat');
    $displayedChats.each(function(i, element) {
      var $username = $(this).children('.username');
      if (app.friends[$username.text()]) {
        $(this).addClass('friend');
      } else {
        $(this).removeClass('friend');
      }
    });
  },

  _refreshInternal: function() {
    app.fetch(app.currentRoom);
    app.refreshRooms();
    app.applyFriendsProperties();
  },
  refresh: function() {
    app._refreshInternal();
    setInterval(app._refreshInternal, 3000);
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

/**
 *"{"code":102,"error":"find field {\"$gt\"=>{\"__type\"=>\"Date\", \"iso\"=>\"2014-04-30T01:47:13.550Z\"}} has invalid type ActiveSupport::HashWithIndifferentAccess"}"
 *
 *
 */
