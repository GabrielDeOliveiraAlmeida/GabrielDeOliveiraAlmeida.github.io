
function convertXML(model) {



	var name = 'file.jff';
	var emptyLabel = 'ϵ';

	//var a = document.getElementById("convertXMLdownload");


	//criando o obj XML
	var parser = new DOMParser()
	var xml = parser.parseFromString('<?xml version="1.0" encoding="utf-8" standalone="no"?><structure></structure>', "application/xml");
	//-----

	var newElement

	newElement = xml.createElement("type"); //cria um novo node 
	xml.getElementsByTagName("structure")[0].appendChild(newElement);//aplica o novo node criado em um outro
	xml.getElementsByTagName("type")[0].appendChild(xml.createTextNode('turing')); //atributo em um node

	newElement = xml.createElement("automaton");
	xml.getElementsByTagName("structure")[0].appendChild(newElement);

	var i = 0;
	//=====================state==================================

	$.each(model.states, function (state) {

		if (state === 'q0') {
			model.states[state].top = 55;
			model.states[state].left = 55;
			model.states[state].startState = true;
		};
		newElement = xml.createElement("state");
		newElement.setAttribute("id", state.slice(1));
		newElement.setAttribute("name", state);
		xml.getElementsByTagName("automaton")[0].appendChild(newElement);

		newElement = xml.createElement("x");
		newElement.appendChild(xml.createTextNode(model.states[state].top + i * 51));
		xml.getElementsByTagName("state")[i].appendChild(newElement);
		newElement = xml.createElement("y");
		newElement.appendChild(xml.createTextNode(model.states[state].left + i * 71));
		xml.getElementsByTagName("state")[i].appendChild(newElement);

		if (model.states[state].isAccept) {
			newElement = xml.createElement("final"); //  final
			xml.getElementsByTagName("state")[i].appendChild(newElement);
		} else if (model.states[state].startState) {
			newElement = xml.createElement("initial"); //initial 
			xml.getElementsByTagName("state")[i].appendChild(newElement);

		}
		i++;


	});

	//=====================state==================================
	i = 0;
	//=====================transition==================================
	$.each(model.transitions, function (index) {

		newElement = xml.createElement("transition");
		xml.getElementsByTagName("automaton")[0].appendChild(newElement);

		newElement = xml.createElement("from");
		newElement.appendChild(xml.createTextNode(model.transitions[index]['stateA'].slice(1)));
		xml.getElementsByTagName("transition")[i].appendChild(newElement);

		newElement = xml.createElement("to");
		newElement.appendChild(xml.createTextNode(model.transitions[index]['stateB'].slice(1)));
		xml.getElementsByTagName("transition")[i].appendChild(newElement);

		newElement = xml.createElement("read");
		if (model.transitions[index]['read'] == emptyLabel) {
			newElement.appendChild(xml.createTextNode(model.transitions[index]['read']));
			xml.getElementsByTagName("transition")[i].appendChild(newElement);
		}
		newElement = xml.createElement("write");
		if (model.transitions[index]['write'] == emptyLabel) {
			newElement.appendChild(xml.createTextNode(model.transitions[index]['write']));
			xml.getElementsByTagName("transition")[i].appendChild(newElement);
		}
		newElement = xml.createElement("move");
		newElement.appendChild(xml.createTextNode(model.transitions[index]['direction']));
		xml.getElementsByTagName("transition")[i].appendChild(newElement);
		i++;

	});
	//=====================transition==================================

	var str = new XMLSerializer().serializeToString(xml);
	var blob = new Blob([str], { type: "application/xml" });
	var url = URL.createObjectURL(blob);
	decisao = confirm("Deseja fazer o download do arquivo?");
	var a = document.createElement('a');
	if (decisao) {
		a.href = url;
		a.download = name;
		a.click();
	}
};