(function() {
    var Interpreters = {}; 

    function ScriptRunner(sceneScript) {
        this.step = 0;
        this.state = {};
        this.sceneScript = sceneScript;
        this.instruction = sceneScript[0];
    }

    ScriptRunner.prototype.subRunner = function (sceneScript) {
        var subRunner = new ScriptRunner(sceneScript);
        // Clone state
        subRunner.state = JSON.parse(JSON.stringify(this.state));
        subRunner.parent = this;
        return subRunner;
    }

    ScriptRunner.prototype.jumpToMarker = function (markerName) {
        var self = this;
        var targetStep = 0;
        var found = false;
        _(this.sceneScript).each (function (step) {
            if (!found && step.marker && step.marker == markerName) {
                self.step = targetStep;
                self.instruction = self.sceneScript[self.step];
                found = true;
            }
            targetStep++;
        });
        if (found) {
            return this.perform();
        }
        // No marker found. Exit and try parent marker
        if (this.parent) {
            if (this.exit()) {
                this.exit();
            }
            this.parent.jumpToMarker(markerName);
        } else {
            this.error('Kann keine Markierung ' + markerName + ' finden');
        }
        return this;
    }

    ScriptRunner.prototype.next = function() {
        if (this.step == this.sceneScript.length) {
            return this;
        }
        this.step = this.step + 1;
        this.instruction = this.sceneScript[this.step];
        return this;
    }

    ScriptRunner.prototype.perform = function() {
        return this.performInstruction(this.instruction);
    }

    ScriptRunner.prototype.performInstruction = function(instruction) {
        if (!instruction) {
            this.debug("Last instruction found. Trying to continue with parent script");
            if (this.exit) {
                this.exit();
            }
            if (this.last) {
                this.last();
            }
            return;
        }
        this.debug("Performing", instruction);
        if (!$.isPlainObject(instruction)) {
            this.error("Ungültige Anweisung ", instruction);
        }
        var self = this;
        var passage = this.passage;
        if (this.interpreter && this.interpreter.exit) {
            this.interpreter.exit(this.instruction, this.passage);
            this.interpreter = null;
        }
        var found = false;
        _(_(Interpreters).keys()).each(function (key) {
            if (!found && instruction[key]) {
                self.debug("Habe gefunden:", key);
                self.interpreter = Interpreters[key];
                self.debug('Interpretiere Anweisung für ', key);
                Interpreters[key].perform(instruction, passage);
                found = true;
            } else if (!found) {
                self.debug("Habe keine Interpretation gefunden für", key);
            }
        });

        if (!found) {
            self.error("Ich weiß nicht, wie ich diese Anweisung interpretieren soll: ", instruction, ". Ich verstehe diese Anweisungen: ", _(Interpreters).keys() );
        }
        return this;
    }

    ScriptRunner.prototype.debug = function() {
        var name = passage.name + ": Anweisung(" + this.runnerLocation() + ")"
        var args = $.makeArray(arguments);
        args.unshift(name)
        Log.debug.apply(Log, args);
        return this;
    }

    ScriptRunner.prototype.runnerLocation = function () {
        if (this.parent) {
            return this.parent.runnerLocation() + "::" + (this.step + 1);
        }
        return "" + (this.step + 1);
    }

    ScriptRunner.prototype.error = function() {
        var name = passage.name + ": Anweisung(" + this.runnerLocation() + "): "
        var logLine = name
        _(arguments).each(function (arg) {
             if ($.isPlainObject(arg)) {
                logLine += " " + JSON.stringify(arg);
            } else if ($.isArray(arg)) {
                logLine += " " + arg.join(', ');
            } else {
                logLine += " " + arg;
            }
        });
        var args = $.makeArray(arguments);
        args.unshift(name)
        Log.error.apply(Log, args);
        alert(logLine);
        return this;
    }

    function render(text) {
        p = new Passage();
        p.source = text;
        return p.render();
    }

    // TODO: Refactor Layout Engine into separate views for background, characters, choices and text
    var Layout = {
        createElements: function () {
            if (this.elements) {
                return;
            }
            var $container = $('body');
            this.elements = {};

            // Layers
            this.elements.$backgroundLayer = $('<div id="backgroundLayer" class="layer">');
            this.elements.$twoCharacterLayer = $('<div id="twoCharacterLayer" class="layer">');
            this.elements.$singleCharacterLayer = $('<div id="singleCharacterLayer" class="layer">');
            this.elements.$textLayer = $('<div id="textLayer" class="layer">');
            this.elements.$choiceLayer = $('<div id="choiceLayer" class="layer">');
            this.elements.$textLayer = $('<div id="textLayer" class="layer">');
            
            this.elements.$leftCharacter = $('<div id="leftCharacter" class="character">');
            //this.elements.$twoCharacterLayer.append(this.elements.$leftCharacter);

            this.elements.$rightCharacter = $('<div id="rightCharacter" class="character">');
            //this.elements.$twoCharacterLayer.append(this.elements.$rightCharacter);
                        
                    
            this.elements.$centerCharacter = $('<div id="centerCharacter" class="character">');
            //this.elements.$singleCharacterLayer.append(this.elements.$centerCharacter);
            
            // Text
            this.elements.$textField = $('<div id="textField">');

            this.elements.$captionField = $('<div id="caption" class="caption">')
            this.elements.$messageField = $('<div id="messageField" class="message">')

            this.elements.$textField.append(this.elements.$captionField).append(this.elements.$messageField);
            this.elements.$textLayer.append(this.elements.$textField);
            
            
            $container.append(this.elements.$backgroundLayer);
            $container.append(this.elements.$twoCharacterLayer);
            $container.append(this.elements.$singleCharacterLayer);
            $container.append(this.elements.$choiceLayer);
            $container.append(this.elements.$textLayer);
        },
        removeElements: function () {
            if (!this.elements) {
                return;
            }
            var elements = this.elements;
            _(_(elements).keys()).each(function (elementName) {
                elements[elementName].remove();
            });
            this.elements = null;
        },
        redraw: function () {
            this.removeElements();
            this.createElements();
            this.updateUI();
        },
        reset: function () {
            this.settings = {};
        },
        hideAll: function () {
            this.elements.$leftCharacter.hide();
            this.elements.$rightCharacter.hide();
            this.elements.$centerCharacter.hide();
            this.elements.$textField.hide();
            this.elements.$captionField.hide();
            this.elements.$messageField.hide();
            this.elements.$choiceLayer.hide();
        },
        updateUI: function() {
            this.hideAll();
            if (!this.settings) {
                return;
            }
            var self = this;
            // Background
            if (this.settings.background) {
                this.elements.$backgroundLayer.css('background-image', 'url(images/backgrounds/' + this.settings.background + '.png)');
            } else {
                this.elements.$backgroundLayer.css('background-color', 'rgba(0,0,0,0)');
            }
            // Initialize Character Containers
            if (this.settings.characterMode && !this.settings.choicesVisible) {
                if (this.settings.characterMode == 'two_characters') {
                    this._setCharacter(this.elements.$leftCharacter, this.settings.leftCharacter);
                    this._setCharacter(this.elements.$rightCharacter, this.settings.rightCharacter);
                    this.elements.$leftCharacter.removeClass('mutedCharacter');
                    this.elements.$rightCharacter.removeClass('mutedCharacter');
                    if (this.settings.muted) {
                        if (this.settings.muted == 'left') {
                            this.elements.$leftCharacter.addClass('mutedCharacter');
                        } else if (this.settings.muted == 'right') {
                            this.elements.$rightCharacter.addClass('mutedCharacter');
                        }
                    }
                    this.elements.$leftCharacter.show();
                    this.elements.$rightCharacter.show();
                } else if (this.settings.characterMode == 'one_character') {
                    this._setCharacter(this.elements.$centerCharacter, this.settings.centerCharacter);
                    this.elements.$centerCharacter.show();
                }
            }
            // Initialize Text Container
            if (this.settings.text && this.settings.textBoxVisible && !this.settings.choicesVisible) {
                if (this.settings.text.caption) {
                    this.elements.$captionField.html(render(this.settings.text.caption));
                    this.elements.$captionField.css('color', this.settings.text.color || 'black');
                    this.elements.$captionField.show();
                }
                if (this.settings.text.message) {
                    this.elements.$messageField.html(render(this.settings.text.message));
                    this.elements.$messageField.css('color', this.settings.text.color || 'black');
                    this.elements.$messageField.show();    
                }
                this.elements.$textField.show();
            }
            
            // Choices
            this.elements.$choiceLayer.empty();
            if (this.settings.choices && this.settings.choicesVisible) {
                this.elements.$choiceLayer.removeClass('singleColumn', 'unevenColumns', 'twoColumns');
                if (this.settings.choices.length < 5) {
                    // Single Column
                    this.elements.$choiceLayer.addClass('singleColumn');
                    var choiceGridTemplateAreas = "";
                    var index = 0;
                    _(this.settings.choices).each (function (choice) {
                        choiceGridTemplateAreas = choiceGridTemplateAreas + '". c' + index +' ." '; // . c0 .
                        self.elements.$choiceLayer.append(
                            $('<div class="choice">').css('grid-area', 'c' + index).html(render(choice.option)).on('click', function (e) {
                                e.stopPropagation();
                                self.settings.choicesVisible = false;
                                self.settings.choices = null;
                                choice.click();
                        }));
                        index++;
                    });
                    this.elements.$choiceLayer.css('grid-template-areas', choiceGridTemplateAreas);
                } else {
                    if (this.settings.choices.length % 2 == 1) {
                        // Two columns, first choice on top
                        this.elements.$choiceLayer.addClass('unevenColumns');
                        var choiceGridTemplateAreas = '". c0 c0 c0 ."';
                        var firstChoice = this.settings.choices[0];
                        self.elements.$choiceLayer.append(
                            $('<div class="choice">').css('grid-area', 'c0').html(render(firstChoice.option)).on('click', function (e) {
                                console.log(e);
                                e.stopPropagation();
                                self.settings.choicesVisible = false;
                                self.settings.choices = null;
                                firstChoice.click();
                        }));
                    
                        for (var index = 1; index < this.settings.choices.length; index += 2) {
                            var choiceA = this.settings.choices[index];
                            var choiceB = this.settings.choices[index+1];
                            choiceGridTemplateAreas = choiceGridTemplateAreas + '"c' + index +' c' + index + ' . c' + (index + 1) + ' c' + (index + 1)+'" '; // c1 c1 . c2 c2
                            self.elements.$choiceLayer.append(
                                $('<div class="choice">').data('choice', index).css('grid-area', 'c' + index).html(render(choiceA.option)).on('click', function (e) {
                                    e.stopPropagation();
                                    self.settings.choicesVisible = false;
                                    var choice = self.settings.choices[$(e.target).data('choice')];
                                    self.settings.choices = null;
                                    choice.click();
                            }));
                            self.elements.$choiceLayer.append(
                                $('<div class="choice">').data('choice', (index+1)).css('grid-area', 'c' + (index + 1)).html(render(choiceB.option)).on('click', function (e) {
                                    e.stopPropagation();
                                    self.settings.choicesVisible = false;
                                    var choice = self.settings.choices[$(e.target).data('choice')];
                                    self.settings.choices = null;
                                    choice.click();
                            }));
                        }
                        this.elements.$choiceLayer.css('grid-template-areas', choiceGridTemplateAreas);
                    } else {
                        // Two columns
                        this.elements.$choiceLayer.addClass('twoColumns');
                        var choiceGridTemplateAreas = "";
                        for (var index = 0; index < this.settings.choices.length; index += 2) {
                            var choiceA = this.settings.choices[index];
                            var choiceB = this.settings.choices[index+1];
                            choiceGridTemplateAreas = choiceGridTemplateAreas + '". c' + index +' c' + (index + 1) + ' ." '; // . c0 c1 .
                            self.elements.$choiceLayer.append(
                                $('<div class="choice">').css('grid-area', 'c' + index).html(render(choiceA.option)).on('click', function (e) {
                                    e.stopPropagation();
                                    self.settings.choicesVisible = false;
                                    self.settings.choices = null;
                                    choiceA.click();
                            }));
                            self.elements.$choiceLayer.append(
                                $('<div class="choice">').css('grid-area', 'c' + (index + 1)).html(render(choiceB.option)).on('click', function (e) {
                                    e.stopPropagation();
                                    self.settings.choicesVisible = false;
                                    self.settings.choices = null;
                                    choiceB.click();
                            }));
                        }
                        this.elements.$choiceLayer.css('grid-template-areas', choiceGridTemplateAreas);
                    }
                }
                this.elements.$choiceLayer.show();
            }
        },
        _setCharacter: function ($container, character) {
            var mood = character.mood || 'neutral';
            var imagePath = 'images/characters/' + character.name + '/' + mood + '.png';
            $container.css('background-image', "url(" + imagePath+ ")");
            $container.css('background-repeat', 'no-repeat');
            $container.css('backgound-attachment', 'fixed');
            $container.css('background-position', 'bottom');
            $container.css('background-size', 'contain');
        },
        setBackground: function (backgroundImage) {
            this.settings = this.settings || {};
            this.settings.background = backgroundImage;
            this.updateUI();
        },
        setLeftCharacter: function (character) {
            this.settings = this.settings || {};
            this.settings.leftCharacter = {
                name: character.name,
                mood: character.mood
            };
            this.updateUI();
        },
        setRightCharacter: function (character) {
            this.settings = this.settings || {};
            this.settings.rightCharacter = {
                name: character.name,
                mood: character.mood
            };
            this.updateUI();

        },
        setCenterCharacter: function (character) {
            this.settings = this.settings || {};
            this.settings.centerCharacter = {
                name: character.name,
                mood: character.mood
            };
            this.updateUI();
        },
        showTwoCharacters: function () {
            this.settings = this.settings || {};
            this.settings.characterMode="two_characters";
            this.updateUI();
        },
        showCenterCharacter: function () {
            this.settings = this.settings || {};
            this.settings.characterMode="one_character";
            this.updateUI();
        },
        hideCharacters: function () {
            this.settings = this.settings || {};
            this.settings.characterMode="none";
            this.updateUI();
        },
        showTextBox: function () {
            this.settings = this.settings || {};
            this.settings.textBoxVisible=true;
            this.updateUI();
        },
        hideTextBox: function () {
            this.settings = this.settings || {};
            this.settings.textBoxVisible=false;
            this.updateUI();
        },
        setText: function (message, options) {
            this.settings = this.settings || {};
            this.settings.text = {message: message, caption: options.caption, color: options.color};
            this.updateUI();
        },
        muteLeftCharacter: function () {
            this.settings = this.settings || {};
            this.settings.muted = 'left';
            this.updateUI();
        },
        muteRightCharacter: function () {
            this.settings = this.settings || {};
            this.settings.muted = 'right';
            this.updateUI();
        },
        unmuteCharacters: function () {
            this.settings = this.settings || {};
            this.settings.muted = 'none';
            this.updateUI();
        },
        presentChoice: function (choices) {
            this.settings = this.settings || {};
            this.settings.choices = choices;
            this.updateUI();
        },
        clearChoices: function () {
            this.settings = this.settings || {};
            this.settings.choices = null;
            this.updateUI();
        },
        showChoices: function () {
            this.settings = this.settings || {};
            this.settings.choicesVisible = true;
            this.updateUI();
        }
    }

    function checkKeys(object, knownKeys, type) {
        var clone = JSON.parse(JSON.stringify(object));
        _(knownKeys).each(function (k) {
            delete clone[k];
        });
        var extra = _(clone).keys();
        if(extra.length > 0) {
            passage.scriptRunner.error('Ich kenne diese Attribute nicht für den Typ ' + type + ' : ', extra, ' Ich kenne nur ', knownKeys);
        }
    }

    Interpreters.setup = {
            perform: function (instruction, passage) {
                if (!$.isPlainObject(instruction.setup)) {
                    passage.scriptRunner.error('Setup hat das falsche Format');
                }
                if (instruction.setup.background && typeof instruction.setup.background !== 'string') {
                    passage.scriptRunner.error('Ungültiges Format für "background". Bitte gib den Background-Namen ein. Beispiel: background: "wald"');
                }
                if (instruction.setup.characters) {
                    if (!$.isArray(instruction.setup.characters)) {
                        passage.scriptRunner.error('Ungültiges Format für "characters". Bitte gib eine Liste von Charakteren an');
                    }
                    _(instruction.setup.characters).each(function (character) {
                        if (!$.isPlainObject(character)) {
                            passage.scriptRunner.error('Ungültiges Format für "characters" Eintrag. Bitte gib die Attribute des Charakters ein (name, caption, mood oder color)', character);
                        }
                        checkKeys(character, ["name", "caption", "color", "mood"], 'character');
                    });
                }
                checkKeys(instruction.setup, ['background', 'characters'], 'Setup');

                var setup = {};
                if (passage.scriptRunner.state.setup) {
                    _.extend(setup, passage.scriptRunner.state.setup, instruction.setup);
                } else {
                    _.extend(setup, instruction.setup);
                }
                passage.scriptRunner.state.setup = setup;
                if (setup.background) {
                    Layout.setBackground(setup.background);
                }
                if (setup.characters) {
                    passage.scriptRunner.state.characters = {}
                    if (setup.characters.length == 1) {
                        // Single character in the center
                        Layout.setCenterCharacter(setup.characters[0]);
                        Layout.showCenterCharacter();
                        passage.scriptRunner.state.mode = 'one_character';
                    } else {
                        // Two characters 
                        Layout.setLeftCharacter(setup.characters[0]);
                        Layout.setRightCharacter(setup.characters[1]);
                        
                        passage.scriptRunner.state.characters._left = setup.characters[0];
                        passage.scriptRunner.state.characters._right = setup.characters[1];

                        Layout.showTwoCharacters();
                        passage.scriptRunner.state.mode = 'two_characters';
                    }
                    _(setup.characters).each(function (character) {
                        passage.scriptRunner.state.characters[character.name] = character;
                    });
                }
                // Go to next step
                passage.scriptRunner.next().perform();
            }
        };
    
    Interpreters.pause = {
            perform: function(instruction, passage) {
                // Noop

            }
        };

    Interpreters.character = {
            perform: function (instruction, passage) {
                var characterName = instruction.character;
                var characterSetupData = passage.scriptRunner.state.characters[characterName] || passage.scriptRunner.error('Charakter ' + characterName + ' ist nicht in der Szene. Hier sind nur: ', _(passage.scriptRunner.state.characters).keys());
                var caption = instruction.caption || characterSetupData.caption || characterName;
                var text = instruction.text || passage.scriptRunner.error('Bitte gib einen Text für den Charakter ' + characterName + ' ein.');
                var color = instruction.color || characterSetupData.color || 'black';
                checkKeys(instruction, ['character', 'text', 'color', 'caption'], 'Charaktersatz ("character")');
                Layout.setText(text, {caption: caption, color: color});
                Layout.showTextBox();
                
                if (passage.scriptRunner.state.mode == 'two_characters') {
                    if (characterName == passage.scriptRunner.state.characters._left.name) {
                        Layout.muteRightCharacter();
                    } else  {
                        Layout.muteLeftCharacter();    
                    }
                }
            },
            exit: function (instruction, passage) {
                Layout.unmuteCharacters();
            }
        };
        
    Interpreters.description = {
            perform: function (instruction) {
                var caption = instruction.caption;
                var text = instruction.description;
                var color = instruction.color || 'black';
                checkKeys(instruction, ['description', 'color', 'caption'], 'Beschreibung ("description")');
                Layout.setText(text, {caption: caption, color: color});
                Layout.showTextBox();
            }
        };

    Interpreters.choice = {
            perform: function (instruction, passage) {
                var choices = [];
                if (!$.isArray(instruction.choice)) {
                    passage.scriptRunner.error("Falsches Format für 'choice'. Muss eine Optionsliste beinhalten", instruction );
                }
                _(instruction.choice).each(function (option) {
                    var include = true
                    if (!$.isPlainObject(option)) {
                        passage.scriptRunner.error("Falsches Format für 'option'. Muss einen 'option: ' Ausdruck beinhalten", instruction );
                    }
                    if (! option.option || typeof option.option !== 'string') {
                        passage.scriptRunner.error("Bitte gib den Optionstext ein (Beispiel: 'option: \"Gehe links\"'");
                    }
                    if (option.unless) {
                        if (window.story.state[option.unless]) {
                            include = false;
                        }
                    }
                    if (include) {
                        var clone = JSON.parse(JSON.stringify(option));
                        delete clone.option;
                        var choice = {
                            option: option.option,
                            instructions: clone,
                            click: function (e) {
                                // Interpret other steps in the object 
                                if ($.isEmptyObject(clone)) {
                                    passage.scriptRunner.next().perform();
                                } else {
                                    passage.scriptRunner.performInstruction(clone);
                                }
                            }
                        };
                        choices.push(choice);    
                    }
                });
                Layout.presentChoice(choices);
                Layout.showChoices();
            }
        };
    
    Interpreters.marker = {
            perform: function (instruction, passage) {
                // Go to next step
                passage.scriptRunner.next().perform();
            }
        };

    Interpreters.jumpTo = {
            perform: function (instruction, passage) {
                // Go to next step
                passage.scriptRunner.jumpToMarker(instruction.jumpTo);
            }
        };
    
    Interpreters.passage = {
            perform: function (instruction) {
                window.story.show(instruction.passage);
            }
        };
    Interpreters.set = {
            perform: function (instruction) {
                var setExpr = instruction.set
                window.story.state[setExpr.name] = setExpr.value;
                 // Go to next step
                 passage.scriptRunner.next().perform();
            }
        };
    
    Interpreters.script = {
            perform: function (instruction, passage) {
                var newScript = instruction.script;
                var oldRunner = passage.scriptRunner;
                // Replace script runner with sub-runner
                passage.scriptRunner = oldRunner.subRunner(newScript);
                passage.scriptRunner.passage = passage;
                // Restore script runner on exit
                passage.scriptRunner.exit = function () {
                    passage.scriptRunner = oldRunner;
                }
                // Continue with regular script on end
                passage.scriptRunner.last = function () {
                    passage.scriptRunner.next().perform();
                }
                passage.scriptRunner.perform();
            }
    };

    Interpreters.debugger = {
        perform: function (instruction, passage) {
            debugger;
        }
    };

    window.initializers = window.initializers || [];

    function getQueryParams(queryString) {
        var query = (queryString || window.location.hash).substring(1); // delete #
        if (!query) {
          return {};
        }
        return _
        .chain(query.split('&'))
        .map(function(params) {
          var p = params.split('=');
          return [p[0], decodeURIComponent(p[1])];
        })
        .object()
        .value()
    }


    window.initializers.push(function () {
        window.query = getQueryParams();

        $(window).on('sm.passage.shown', function (event, eventObject) {
            try {
                if (passage.tags.includes("noyaml")) {
                    Log.debug("Passage ", passage.name, " includes 'noyaml' tag, so skipping script parsing");
                    return;
                }
                sceneScript = jsyaml.load(passage.source);
                Layout.reset();
                Layout.redraw();
                passage.scriptRunner = new ScriptRunner(sceneScript);
                passage.scriptRunner.passage = passage;
                passage.scriptRunner.last = function () {
                    Log.debug('Finis');
                };
                passage.scriptRunner.perform();
            } catch (error) {
                // Doesn't look like yaml, so ignore
                console.error(error);
            }
        });
        
        $(window).on('click', function () {
            if (passage.scriptRunner) {
                passage.scriptRunner.next().perform();
            }
        });
    });
}());