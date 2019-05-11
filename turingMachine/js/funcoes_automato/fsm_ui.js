var fsm = (function () {
	var self = null;
	var delegate = null;
	var container = null;
	var stateCounter = 0;
	var saveLoadDialog = null;
	var i;
	var pointer;
	var emptyLabel = 'ϵ';

	var localStorageAvailable = function () {
		return (typeof Storage !== "undefined" && typeof localStorage !== "undefined");
	};

	var refreshLocalStorageInfo = function () {
		if (localStorageAvailable()) {
			$('#storedMachines').empty();
			var keys = [];
			for (var i = 0; i < localStorage.length; ++i) {
				keys.push(localStorage.key(i));
			}
			keys.sort();
			$.each(keys, function (idx, key) {
				$('<li></li>', {
						'class': 'machineName'
					})
					.append($('<span></span>').html(key))
					.append('<div class="delete" style="display:none;" title="Excluir"><img class="delete" src="images/empty.png" /></div>')
					.appendTo('#storedMachines');
			});
		}
	};

	//iniciar o jsplumb
	var initJsPlumb = function () {
		jsPlumb.importDefaults({
			Anchors: ["Continuous", "Continuous"],
			ConnectorZIndex: 5,
			ConnectionsDetachable: false,
			Endpoint: ["Dot", {
				radius: 2
			}],
			HoverPaintStyle: {
				strokeStyle: "#d44",
				lineWidth: 2
			},
			ConnectionOverlays: [
				["Arrow", {
					location: 1,
					length: 14,
					foldback: 0.8
				}],
				["Label", {
					location: 0.5,
					length: 24
				}]
			],
			Connector: ["StateMachine", {
				curviness: 0
			}],
			PaintStyle: {
				strokeStyle: 'black',
				lineWidth: 2
			}
		});

		jsPlumb.bind("click", connectionClicked);
	};

	var initStateEvents = function () {
		//Configuração para manipular o botao de deletar
		container.on('mouseover', 'div.state', function (event) {
			$(this).find('div.delete').show();
		}).on('mouseout', 'div.state', function (event) {
			$(this).find('div.delete').hide();
		});
		container.on('click', 'div.delete', function (event) {
			self.removeState($(this).closest('div.state'));
		});

		/// Configuração para mudanças de estado de aceitação
		container.on('change', 'input[type="checkbox"].isAccept', function (event) {
			var cBox = $(this);
			var stateId = cBox.closest('div.state').attr('id');
			if (cBox.prop('checked')) {
				delegate.fsm().addAcceptState(stateId);
			} else {
				delegate.fsm().removeAcceptState(stateId);
			}
		});
	};

	var initFSMSelectors = function () {
		$('button.delegate').on('click', function () {
			var newDelegate = null;
			switch ($(this).html()) {
				case 'AFD':
					newDelegate = afd_delegate;
					break;
				case 'AFND':
					newDelegate = afnd_delegate;
					break;
			}
			if (newDelegate !== delegate) {
				self.setDelegate(newDelegate);
				$('button.delegate').prop('disabled', false);
				$(this).prop('disabled', true);
			}
		});

		$('button.delegate').each(function () {
			if ($(this).html() === 'AFND') {
				$(this).click();
			}
		});
	};

	var loadSerializedFSM = function (serializedFSM) {
		var model = serializedFSM;
		console.log(model)
		model = JSON.parse(serializedFSM);

		self.reset();
		$('button.delegate').each(function () {
			if ($(this).html() === model.type) {
				$(this).click();
			}
		});

		// $('#acceptStrings').val(model.bulkTests.accept);
		// $('#rejectStrings').val(model.bulkTests.reject);

		// Criar estados
		$.each(model.states, function (stateId, data) {
			var state = null;
			if (stateId !== 'q0') {
				state = makeState(stateId)
					.css('left', data.left + 'px')
					.css('top', data.top + 'px')
					.appendTo(container);
				jsPlumb.draggable(state, {
					containment: "parent"
				});
				makeStatePlumbing(state);
			} else {
				state = $('#q0');
			}
			if (data.isAccept) {
				state.find('input.isAccept').prop('checked', true);
			}
		});

		// Criar transições
		jsPlumb.unbind("jsPlumbConnection");
		$.each(model.transitions, function (index, transition) {
			jsPlumb.connect({
				source: transition.stateA,
				target: transition.stateB
			}).setLabel(transition.read + " " + transition.write + " " + transition.direction);
		});
		jsPlumb.bind("jsPlumbConnection", delegate.connectionAdded);

		delegate.deserialize(model);
	};

	var updateStatusUI = function (status) {
		if (status === null) {
			$('#fsmDebugInputStatus span.currentInput').html('[Fim]');
			$('#fsmDebugInputStatus span.futureInput').html('');
		} else {
			$('#fsmDebugInputStatus span.consumedInput').html(status.expression.substring(0, i));
			if (status.read == delegate.getEmptyLabel()) {
				$('#fsmDebugInputStatus span.currentInput').html(delegate.getEmptyLabel());
				$('#fsmDebugInputStatus span.futureInput').html(status.expression.substring(0, i));

			} else {
				$('#fsmDebugInputStatus span.currentInput').html(status.expression.substr(i, 1));
				$('#fsmDebugInputStatus span.futureInput').html(status.expression.substring(i + 1, 1));
			}
		}
	};


	var tapeUI = function (state) {
		if (state === null) {
			alert("Simulação concluída");
		} else {
			var str1 = state.expression.substring(0, state.pointer);
			var str2 = state.expression.substring(state.pointer, state.pointer + 1);
			var str3 = state.expression.substring(state.pointer + 1, state.expression.length );
			// console.log(str1+"---"+str2+"---"+str3);	
			$('#fsmDebugInputStatus1 span.currentInput').html(str1);
			$('#fsmDebugInputStatus2 span.consumedInput').html(str2);
			$('#fsmDebugInputStatus2 span.currentInput').html(str3);
		}
	};

	var connectionClicked = function (connection) {
		delegate.connectionClicked(connection);
	};

	var checkHashForModel = function () {
		// var hash = window.location.hash;
		// hash = hash.replace('#', '');
		// hash = decodeURIComponent(hash);
		// if (hash) {loadSerializedFSM(hash);}
		loadSerializedFSM(queryString());
	};

	var domReadyInit = function () {
		self.setGraphContainer($('#machineGraph'));

		$(window).resize(function () {
			container.height($(window).height() - $('#mainHolder h1').outerHeight() - $('#footer').outerHeight() - $('#bulkResultHeader').outerHeight() - $('#resultConsole').outerHeight() - 30 + 'px');
			jsPlumb.repaintEverything();
		});
		$(window).resize();

		$('#testString').keyup(function (event) {
			if (event.which === $.ui.keyCode.ENTER) {
				$('#testBtn').trigger('click');
			}
		});

		container.dblclick(function (event) {
			self.addState({
				top: event.offsetY,
				left: event.offsetX
			});
		});

		initJsPlumb();
		initStateEvents();
		initFSMSelectors();
		checkHashForModel();
	};

	var makeStartState = function () {
		var startState = makeState('q0');
		startState.find('div.delete').remove(); // Não pode deletar inicial
		container.append(startState);
		makeStatePlumbing(startState);
	};

	var makeState = function (stateId) {
		return $('<div id="' + stateId + '" class="state"></div>')
			.append('<input id="' + stateId + '_isAccept' + '" type="checkbox" class="isAccept" value="true" title="Final" />')
			.append(stateId)
			.append('<div class="plumbSource" title="Arraste daqui para criar nova transição">&nbsp;</div>')
			.append('<div class="delete" style="display:none;" title="Excluir"><img class="delete" src="images/empty.png" /></div>');
	};

	var makeStatePlumbing = function (state) {
		var source = state.find('.plumbSource');
		jsPlumb.makeSource(source, {
			parent: state,
			maxConnections: 10,
			onMaxConnections: function (info, e) {
				alert("Maximo de (" + info.maxConnections + ") conexões");
			},
		});

		jsPlumb.makeTarget(state, {
			dropOptions: {
				hoverClass: 'dragHover'
			}
		});
		return state;
	};

	return {
		init: function () {
			self = this;
			$(domReadyInit);
			return self;
		},

		setDelegate: function (newDelegate) {
			delegate = newDelegate;
			delegate.setContainer(container);
			delegate.reset().fsm().setStartState('q0');
			jsPlumb.unbind("jsPlumbConnection");
			jsPlumb.reset();
			container.empty();
			initJsPlumb();
			jsPlumb.bind("jsPlumbConnection", delegate.connectionAdded);
			stateCounter = 1;
			makeStartState();
			return self;
		},

		setGraphContainer: function (newContainer) {
			container = newContainer;
			jsPlumb.Defaults.Container = container;
			return self;
		},

		addState: function (location) {
			while ($('#q' + stateCounter).length > 0) {
				++stateCounter;
			} // previnir estados duplicados
			var state = makeState('q' + stateCounter);
			if (location && location.left && location.top) {
				state.css('left', location.left + 'px')
					.css('top', location.top + 'px');
			}
			container.append(state);
			jsPlumb.draggable(state, {
				containment: "parent"
			});
			makeStatePlumbing(state);
			return self;
		},

		removeState: function (state) {
			var stateId = state.attr('id');
			jsPlumb.select({
				source: stateId
			}).detach(); // remover todas as conexoes
			jsPlumb.select({
				target: stateId
			}).detach();
			state.remove();
			delegate.fsm().removeTransitions(stateId); // remover transiçoes
			delegate.fsm().removeAcceptState(stateId);
			return self;
		},

		removeConnection: function (connection) {
			jsPlumb.detach(connection);
		},

		test: function (input) {
			if ($.type(input) === 'string') {
				$('#testResult').html('Testando...')
				var accepts = delegate.fsm().accepts(input);
				$('#testResult').html(accepts ? 'Aceito' : 'Rejeitado').effect('highlight', {
					color: accepts ? '#bfb' : '#fbb'
				}, 1000);
			} else {
				$('#resultConsole').empty();
				var makePendingEntry = function (input, type) {
					return $('<div></div>', {
						'class': 'pending',
						title: 'Pending'
					}).append(type + ' ' + (input === '' ? '[vazio]' : input)).appendTo('#resultConsole');
				};
				var updateEntry = function (result, entry) {
					entry.removeClass('pending').addClass(result).attr('title', result).append(' --> ' + result);
				};
				$.each(input.accept, function (index, string) {
					updateEntry((delegate.fsm().accepts(string) ? 'Passou' : 'Falhou'), makePendingEntry(string, ''));
				});

				$('#bulkResultHeader').effect('highlight', {
					color: '#add'
				}, 1000);
			}
			return self;
		},

		debug: function (input) {

			if ($('#stopBtn').prop('disabled')) {
				i = 1;
				$('#testResult').html('&nbsp;');
				$('#stopBtn').prop('disabled', false);
				$('#loadBtn, #testBtn, #bulkTestBtn, #testString, #resetBtn').prop('disabled', true);
				$('button.delegate').prop('disabled', true);
				$('#fsmDebugInputStatus1').show();
				$('#fsmDebugInputStatus2').show();
				$('#fsmDebugInputStatus3').show();

				var teste = delegate.fsm().stepInit(input);
				$('#fsmDebugInputStatus1 span.currentInput').html(input);
				if (!teste) {
					$('#fsmDebugInputStatus1 span.currentInput').html("Rejeitado");
					$('#testResult').html('Rejeitado').effect('highlight', {
						color: '#fbb'
					}, 1000);
					return;
				}else{
				delegate.debugStart();
					var status = delegate.fsm().firstStep();
					// $('#fsmDebugInputStatus1 span.consumedInput').html(status.expression.substring(0,1));
					// $('#fsmDebugInputStatus2 span.currentInput').html(status.expression.substring(1,status.expression.length));
					delegate.updateUI(status);
					tapeUI(status);
				}
			} else {
				var status = delegate.fsm().stepByStep(i);
				if(status === null)	$('#debugBtn').prop('disabled', true);
				tapeUI(status);
				delegate.updateUI(status);
				i++;
				if (delegate.fsm().getFound()) {
						$('#testResult').html('Aceito').effect('highlight', {
							color: '#bfb'}, 1000);
				}else{
					$('#testResult').html('Rejeitado').effect('highlight', {
						color: '#fbb'}, 1000);
				}
			}
			return self;
		},

		debugStop: function () {
			$('#fsmDebugInputStatus1').hide();
			$('#fsmDebugInputStatus2').hide();
			$('#fsmDebugInputStatus3').hide();

			$('#stopBtn').prop('disabled', true);
			$('#loadBtn, #testBtn, #bulkTestBtn, #debugBtn, #testString, #resetBtn').prop('disabled', false);
			$('button.delegate').prop('disabled', false).each(function () {
				switch ($(this).html()) {
					case 'AFD':
						if (delegate === afd_delegate) {
							$(this).prop('disabled', true);
						}
						break;
					case 'AFND':
						if (delegate === afnd_delegate) {
							$(this).prop('disabled', true);
						}
						break;
				}
			});
			delegate.debugStop();
			return self;
		},

		reset: function () {
			self.setDelegate(delegate);
			$('#testString').val('');
			$('#testResult').html('&nbsp;');
			$('#acceptStrings').val('');
			$('#rejectStrings').val('');
			$('#resultConsole').empty();
			return self;
		},

		teste: function () {
			delegate.teste();
		},

		ERT: function () {
			delegate.ERT();
		},
		afndtoafd: function () {


			var obj = delegate.convertAFNDtoAFD();
			console.log('aqui');
			console.log(obj);
			loadSerializedFSM(JSON.stringify(obj));
		},

		convertXML: function () {
			convertXML(delegate.serialize());
		},

		convertJSON: function (xml) {

			var model;

			model = convertJSON(xml);

			loadSerializedFSM(JSON.stringify(model));

		}


	};
})().init();


/******************************************************************************/
