var afnd_delegate = (function () {
  var self = null;
  var afnd = null;
  var container = null;
  var dialogDiv = null;
  var dialogActiveConnection = null;
  var emptyLabel = 'ϵ';

  var statusConnectors = [];

  var updateUIForDebug = function(status) {
    if(status === null) return;
    
    $('.current').removeClass('current');

    $.each(statusConnectors, function(index, connection) {
      connection.setPaintStyle(jsPlumb.Defaults.PaintStyle);
    });
    
    var comparisonChar = status.read;
    var curstatus = $('#' + status.state.final).addClass('current');
    var connection = jsPlumb.select({source:status.state.final});
    statusConnectors.push(connection);
    connection.setPaintStyle({strokeStyle:'green'});
    return self;
  };

  var dialogSave = function (update) {
    var inputRead = $('#afnd_dialog_readCharTxt').val();
    var inputWrite = $('#afnd2_dialog_readCharTxt').val();
    var inputRLS = $('#afndRL_dialog_readCharTxt').val();

    if (inputRead.length > 1) { inputRead = inputRead[0]; }
    if (inputWrite.length > 1) { inputWrite = inputWrite[0]; }
    if (inputRLS.length > 1) { inputRLS = inputRLS[0]; }

    
  

    if (update) {
      afnd.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
    } if (afnd.hasTransition(dialogActiveConnection.sourceId, inputRead, inputWrite, inputRLS, dialogActiveConnection.targetId)) {
      alert(dialogActiveConnection.sourceId + " já existe transição para " + dialogActiveConnection.targetId + " em " + (inputRead || emptyLabel));
      return;
    }
    //dialog={inputRead, write: inputWrite, direction: inputRLS || emptyLabel}
    dialog = inputRead + " " + inputWrite + " " + inputRLS;
    dialogActiveConnection.setLabel(dialog || emptyLabel);
    afnd.addTransition(dialogActiveConnection.sourceId, inputRead, inputWrite, inputRLS, dialogActiveConnection.targetId);
    dialogDiv.dialog("close");
  };

  var dialogCancel = function (update) {
    if (!update) { fsm.removeConnection(dialogActiveConnection); }
    dialogDiv.dialog("close");
  };

  var dialogDelete = function () {
    afnd.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
    fsm.removeConnection(dialogActiveConnection);
    dialogDiv.dialog("close");
  };

  var dialogClose = function () {
    dialogActiveConnection = null;
  };

  var makeDialog = function () {
    dialogDiv = $('<div></div>', { style: 'text-align:center;' });
    $('<div></div>', { style: 'font-size:small;' }).html('Deixe em branco para vazio: ' + emptyLabel + '<br />').appendTo(dialogDiv);
    $('<span></span>', { id: 'afnd_dialog_stateA', 'class': 'tranStart' }).appendTo(dialogDiv);
    $('<input />', { id: 'afnd_dialog_readCharTxt', type: 'text', maxlength: 1, style: 'width:30px;text-align:center;' })
      .val('a')
      .focusout(function(){
        if($(this).val() == ""){
          $(this).val(emptyLabel);
        }
      })
      .keypress(function (event) {
        if (event.which === $.ui.keyCode.ENTER) { $(this).next(':input').focus().select(); }
      })
      .appendTo(dialogDiv);
    $('<input />', { id: 'afnd2_dialog_readCharTxt', type: 'text', maxlength: 1, style: 'width:30px;text-align:center;' })
      .val('A')
      .focusout(function(){
        if($(this).val() == ""){
          $(this).val(emptyLabel);
        }
      })
      .keypress(function (event) {
        if (event.which === $.ui.keyCode.ENTER) { $(this).next(':input').focus().select();  }
      })
      .appendTo(dialogDiv);
    $('<input/>', { id: 'afndRL_dialog_readCharTxt', type: 'text', maxlength: 1, style: 'width:30px;text-align:center;' })
      .val('R')
      .keypress(function (event) {
        if (event.which === $.ui.keyCode.ENTER) { dialogDiv.parent().find('div.ui-dialog-buttonset button').eq(-1).click(); }
      })
      .appendTo(dialogDiv);
    $('<span></span>', { id: 'afnd_dialog_stateB', 'class': 'tranEnd' }).appendTo(dialogDiv);
    $('body').append(dialogDiv);

    dialogDiv.dialog({
      dialogClass: "no-close",
      autoOpen: false,
      title: 'Entre com transição',
      height: 220,
      width: 350,
      modal: true,
      open: function () { dialogDiv.find('afnd_dialog_readCharTxt').focus().select(); }
    });
  };

  return {
    init: function () {
      self = this;
      afnd = new AFND();
      makeDialog();
      return self;
    },

    setContainer: function (newContainer) {
      container = newContainer;
      return self;
    },

    fsm: function () {
      return afnd;
    },

    connectionAdded: function (info) {
      dialogActiveConnection = info.connection;
      $('#afnd_dialog_stateA').html(dialogActiveConnection.sourceId + '&nbsp;');
      $('#afnd_dialog_stateB').html('&nbsp;' + dialogActiveConnection.targetId);

      dialogDiv.dialog('option', 'buttons', {
        Cancel: function () { dialogCancel(false); },
        Save: function () { dialogSave(false); }
      }).dialog("open");
    },

    connectionClicked: function (connection) {
      dialogActiveConnection = connection;
      text = dialogActiveConnection.getLabel();
      regExp = new RegExp("^(.\|.\|.)$");
      text = text.split(' ');
      $('#afnd_dialog_readCharTxt').val(text[0]);
      $('#afnd2_dialog_readCharTxt').val(text[1]);
      $('#afndRL_dialog_readCharTxt').val(text[2]);
      dialogDiv.dialog('option', 'buttons', {
        Cancel: function () { dialogCancel(true); },
        Delete: dialogDelete,
        Save: function () { dialogSave(true); }
      }).dialog("open");
    },

    updateUI: updateUIForDebug,

    getEmptyLabel: function () { return emptyLabel; },

    reset: function () {
      afnd = new AFND();
      return self;
    },

    debugStart: function () {
      return self;
    },

    debugStop: function () {
      $('.current').removeClass('current');
      return self;
    },

    serialize: function () {
      // Converte para um formato serializado

      var model = {};
      model.type = 'AFND';
      model.afnd = afnd.serialize();
      model.states = {};
      model.transitions = [];
      $.each(model.afnd.transitions, function (stateA, transition) {
        model.states[stateA] = {};
        $.each(transition, function (character, states) {
          $.each(states, function (index, state) {
            model.states[state.final] = {};
            model.transitions.push({
              stateA: stateA,
              read: (character || emptyLabel),
              write: state.write,
              direction: state.direction,
              stateB: state.final
            });
          });
        });
      });
      var i = 1;
      $.each(model.states, function (index) {
        if (model.afnd.acceptStates.includes(index)) {
          model.states[index].isAccept = true;
        }
        model.states[index].top = 55 + i * 55;
        model.states[index].left = 55 + i * 81;
        i++;
      });
      model.states['q0'] = {};

      return model;
    },

    deserialize: function (model) {
      console.log(model);
      afnd.deserialize(model.afnd);
    },

    teste: function () {
      testarchamada(afnd.encode(), afnd.finais(), 'afnd');
    },
    ERT: function () {
      testarchamadaERT(afnd.encode(), afnd.finais(), 'afnd');
    },
    convertAFNDtoAFD: function () {


      var estadosfinais = [];
      var transition = {};
      var obj;
      transition = afnd.getTr();
      estadosfinais = afnd.finais();

      return (AFNDtoAFD(transition, estadosfinais));

    }
  };
}()).init();
