function AFND(useDefaults) {
  "use strict";
  this.transitions = {};
  this.startState = useDefaults ? 'start' : null;
  this.acceptStates = useDefaults ? ['accept'] : [];
  this.history;
  this.i;
}



$(function () {
  "use strict";

  AFND.prototype.transition = function (state, inputRead) {
    var retVal = (this.transitions[state]) ? this.transitions[state][inputRead] : null;
    return !retVal ? null : retVal;
  };

  AFND.prototype.deserialize = function (json) {
    console.log(json);
    this.transitions = json.transitions;
    this.startState = json.startState;
    this.acceptStates = json.acceptStates;
    return this;
  };

  AFND.prototype.serialize = function () {
    return {
      transitions: this.transitions,
      startState: this.startState,
      acceptStates: this.acceptStates
    };
  };


  AFND.prototype.loadFromString = function (JSONdescription) {
    var parsedJSON = JSON.parse(JSONdescription);
    return this.deserialize(parsedJSON);
  };
  AFND.prototype.saveToString = function () {
    return JSON.stringify(this.serialize());
  };

  AFND.prototype.addTransition = function (stateA, inputRead, inputWrite, inputRLS, stateB) {
    if (!this.transitions[stateA]) {
      this.transitions[stateA] = {};
    }
    if (!this.transitions[stateA][inputRead]) {
      this.transitions[stateA][inputRead] = [];
    }
    this.transitions[stateA][inputRead].push({
      final: stateB,
      write: inputWrite,
      direction: inputRLS
    });
    console.log(this.transitions);
    return this;
  };

  AFND.prototype.hasTransition = function (stateA, inputRead, inputWrite, inputRLS, stateB) {
    if (this.transitions[stateA] && this.transitions[stateA][inputRead]) {
      for (var i = 0; i < this.transitions[stateA][inputRead].length; i++) {
        if (this.transitions[stateA][inputRead][i].direction == inputRLS &&
          this.transitions[stateA][inputRead][i].write == inputWrite &&
          this.transitions[stateA][inputRead][i].final == stateB) return true;
      }
    }
    return false;
  };

  AFND.prototype.getTransition = function (stateA, inputRead, inputWrite, inputRLS, stateB) {
    if (this.transitions[stateA] && this.transitions[stateA][inputRead]) {
      for (var i = 0; i < this.transitions[stateA][inputRead].length; i++) {
        if (this.transitions[stateA][inputRead][i].direction == inputRLS &&
          this.transitions[stateA][inputRead][i].write == inputWrite &&
          this.transitions[stateA][inputRead][i].final == stateB) return i;
      }
    }
    return -1;
  };

  AFND.prototype.removeTransitions = function (state) {
    delete this.transitions[state];
    var self = this;
    $.each(self.transitions, function (stateA, sTrans) {
      $.each(sTrans, function (char, states) {
        if (states.indexOf(state) >= 0) {
          self.removeTransition(stateA, char, state);
        }
      });
    });
    return this;
  };

  AFND.prototype.removeTransition = function (stateA, input, stateB) {
    text = input.split(' ');
    if (this.hasTransition(stateA, text[0], text[1], text[2], stateB)) {
      var pos = this.getTransition(stateA, text[0], text[1], text[2], stateB);
      this.transitions[stateA][text[0]].splice(this.transitions[stateA][text[0]][pos], 1);
    }
    return this;
  };

  AFND.prototype.setStartState = function (state) {
    this.startState = state;
    return this;
  };

  AFND.prototype.addAcceptState = function (state) {
    this.acceptStates.push(state);
    return this;
  };
  AFND.prototype.removeAcceptState = function (state) {
    var stateI = -1;
    if ((stateI = this.acceptStates.indexOf(state)) >= 0) {
      this.acceptStates.splice(stateI, 1);
    }
    return this;
  };

  AFND.prototype.accepts = function (input) {
    if (this.stepInit(input)) {
      return 'Accept';
    }
    return 'Reject';
  };
  AFND.prototype.stepInit = function (input) {
    this.i=1;
    console.log("Executando Turing Machine '" + input + "'");
    var hist = new HistoryLog(input.split(""));
    this.history = this.step(hist, this.startState);
    console.log("RESULT: " + this.history.found);
    return this.history.found;
  };

  AFND.prototype.step = function (log, state) {
    var char = log.getRead();
    console.log("Looking for: " + char + "  de  " + log.expression);
    var states;
    try {
      states = this.transitions[state][char];
    } catch (e) {
      return log;
    }
    for (var currentState in states) {
      console.log("Transition founded --> State:" + states[currentState].final + " Expression: " +
        log.expression + " Pointer: " + log.pointer);

      var newLog = log.clone(log.expression);
      newLog.tapeFunction(char, states[currentState]);
      var resultLog = this.step(newLog, states[currentState].final);

      if (this.isFinal(resultLog.lista[resultLog.lista.length - 1].state.final)) {
        console.log("State final is here");
        resultLog.found = true;
        return resultLog;
      }
    }

    try {
      if (this.isFinal(states[currentState - 1].final)) {
        log.found = true;
      }
    } catch (e) {
      //Nada
    }
    return log;
  }

  AFND.prototype.isFinal = function (wanted) {
    for (var i = 0; i < this.acceptStates.length; i++) {
      if (this.acceptStates[i] == wanted) {
        return true;
      }
    }
    return false;
  }

  AFND.prototype.status = function () {
    var log = this.history.lista;
    for (var i = 1; i < log.length; i++) {
      var conteudo = log[i - 1].expression;
      var char = log[i].read;
      var state = log[i].state.final;
      var write = log[i].state.write;
      var direction = log[i].state.direction;
      console.log("Tape content: " + conteudo + " Move to State: " + state +
        " Transitions (" + char + " | " + write + " | " + direction + " ) ---> " + log[i].expression);
    }
  };


  AFND.prototype.stepByStep = function (i) {
    var log = this.history.lista;
    if(i >= log.length) return null;
    var conteudo = log[i - 1].expression;
    var char = log[i].read;
    var state = log[i].state.final;
    var write = log[i].state.write;
    var direction = log[i].state.direction;
    console.log("Tape content: " + conteudo + " Move to State: " + state +
      " Transitions (" + char + " | " + write + " | " + direction + " ) ---> " + log[i].expression);
    return log[i];
  };

  AFND.prototype.firstStep = function(){
    var log = this.history.lista[0];
    return log;
  }

  AFND.prototype.getFound = function(){
    return this.history.found;
  }
});