(function() {
    var Interpreters = {}; 

    function ScriptRunner(sceneScript) {
        this.step = 0;
        this.state = {};
        this.sceneScript = sceneScript;
        this.instruction = sceneScript[0];
    }

    ScriptRunner.prototype.jumpToMarker = function (markerName) {
        // TODO
        return this;
    }

    ScriptRunner.prototype.next = function() {
        // TODO: Check Bounds
        if (this.interpreter && this.interpreter.exit) {
            this.interpreter.exit(this.instruction, this.passage);
        }
        this.step = this.step + 1;
        this.instruction = this.sceneScript[this.step];
        return this;
    }

    ScriptRunner.prototype.perform = function() {
        var self = this;
        var instruction = this.instruction;
        var passage = this.passage;
        _(_(Interpreters).keys()).each(function (key) {
            if (instruction[key]) {
                self.interpreter = Interpreters[key];
                Interpreters[key].perform(instruction, passage);
            }
        });
        return this;
    }

    function render(text) {
        p = new Passage();
        p.source = text;
        return p.render();
    }

    var Layout = {
        createElements: function () {
            if (this.elements) {
                return;
            }
            var $container = $('body');
            this.elements = {};

            this.elements.$backgroundLayer = $('<div id="backgroundLayer" class="layer">');
            this.elements.$twoCharacterLayer = $('<div id="twoCharacterLayer" class="layer">');
            this.elements.$singleCharacterLayer = $('<div id="singleCharacterLayer" class="layer">');
            this.elements.$textLayer = $('<div id="textLayer" class="layer">');
            
            this.elements.$leftCharacter = $('<div id="leftCharacter" class="character">');
            this.elements.$twoCharacterLayer.append(this.elements.$leftCharacter);
            
            this.elements.$rightCharacter = $('<div id="rightCharacter" class="character">');
            this.elements.$twoCharacterLayer.append(this.elements.$rightCharacter);
            
            
            this.elements.$centerCharacter = $('<div id="centerCharacter" class="character">');
            this.elements.$singleCharacterLayer.append(this.elements.$centerCharacter);
            
            this.elements.$textField = $('<div id="textField">');

            this.elements.$captionField = $('<div id="caption" class="caption">')
            this.elements.$messageField = $('<div id="messageField" class="message">')

            this.elements.$textField.append(this.elements.$captionField).append(this.elements.$messageField);
            this.elements.$textLayer.append(this.elements.$textField);
            
            
            $container.append(this.elements.$backgroundLayer);
            $container.append(this.elements.$twoCharacterLayer);
            $container.append(this.elements.$singleCharacterLayer);
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
        hideAll: function () {
            this.elements.$leftCharacter.hide();
            this.elements.$rightCharacter.hide();
            this.elements.$centerCharacter.hide();
            this.elements.$textField.hide();
            this.elements.$captionField.hide();
            this.elements.$messageField.hide();
        },
        updateUI: function() {
            this.hideAll();
            if (!this.settings) {
                return;
            }
            // Background
            if (this.settings.background) {
                this.elements.$backgroundLayer.css('background-image', 'url(images/backgrounds/' + this.settings.background + '.png)');
            } else {
                this.elements.$backgroundLayer.css('background-color', 'rgba(0,0,0,0)');
            }
            // Initialize Character Containers
            if (this.settings.characterMode) {
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
            if (this.settings.text && this.settings.textBoxVisible) {
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
        }
    }

    window.Layout = Layout; // For Debugging

    Interpreters.setup = {
            perform: function (instruction, passage) {
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

    Interpreters.character = {
            perform: function (instruction, passage) {
                var characterName = instruction.character;
                var characterSetupData = passage.scriptRunner.state.characters[characterName] || {};
                var caption = instruction.caption || characterSetupData.caption || characterName;
                var text = instruction.text;
                var color = instruction.color || characterSetupData.color || 'black';
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
                Layout.setText(text, {caption: caption, color: color});
                Layout.showTextBox();
            }
        };

    Interpreters.choice = {
            perform: function (instruction) {
                console.log(instruction);
            }
        };
    
    Interpreters.marker = {
            perform: function (instruction, passage) {
                // Go to next step
                passage.scriptRunner.next().perform();
            }
        };
    
    Interpreters.passage = {
            perform: function (instruction) {
                window.story.show(instruction.passage);
            }
        };

    window.initializers = window.initializers || [];

    window.initializers.push(function () {
        $(window).on('sm.passage.shown', function (event, eventObject) {
            try {
                sceneScript = jsyaml.load(passage.source);
                Layout.redraw();
                passage.scriptRunner = new ScriptRunner(sceneScript);
                passage.scriptRunner.passage = passage;
                passage.scriptRunner.perform();
            } catch (error) {
                // Doesn't look like yaml, so ignore
            }
        });
        
        $(window).on('click', function () {
            if (passage.scriptRunner) {
                passage.scriptRunner.next().perform();
            }
        });
    });
}());