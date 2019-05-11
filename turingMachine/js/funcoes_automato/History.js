function HistoryLog(input){
    this.expression = input;
    this.lista = [{
      read: '',
      pointer:0,
      expression: input.join(""),
      state: {final: "q0", write: "", direction: "" },
    } ]; 
    this.pointer = 0;
    this.found = false;
    this.emptyLabel = 'ϵ';
  }
  
  HistoryLog.prototype.getRead= function(){
    return this.expression[this.pointer];
  }

  HistoryLog.prototype.clone = function(input){
    var log = new HistoryLog(input);
    log.lista = JSON.parse(JSON.stringify(this.lista));
    log.pointer = this.pointer;
    log.found = this.found;
    return log;  
  }

  HistoryLog.prototype.tapeFunction = function(char, state){
    this.expression[this.pointer] = state.write;
    switch(state.direction){
        case 'L':
            this.pointer--;
            if(this.pointer<0){
                this.pointer++;
                this.expression.unshift(this.emptyLabel);
            }
            break;
        case 'R':
            this.pointer++;
            if(this.pointer >= this.expression.length ){
                this.expression.push(this.emptyLabel);
            }
            break;
    }  
    this.lista.push({read: char, pointer: this.pointer, expression: this.expression.join("") ,state: state});
    
  }