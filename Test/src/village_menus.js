// TODO: Change to ARC Base Object
function GameMenu(title, width, height, backgroundImageUrl, classes, location = 0) {
    // Location: 0 - center, 1 - top, 2 - bottom

    var _this = this;
    this.pauseGame = true;

    // Create the title bar
    var popup = $("<div></div>");
    if (backgroundImageUrl && backgroundImageUrl !== null) {
        popup.css('background-image', 'url(' + backgroundImageUrl + ')');
    }

    popup.addClass("game_dialogWindow");
    popup.css("width", width + "px");
    popup.css("height", height + "px");
    popup.hide();

    if (classes && typeof classes === "string") {
        var classSplit = classes.split(" ");
        for (var i = 0; i < classSplit.length; ++i) {
            popup.addClass(classSplit[i]);
        }
    }

    var titleBar = $("<div></div>");
    titleBar.addClass("game_dialogTitleBar");
    titleBar.text(title);
    popup.append(titleBar);
    this.titleBar = titleBar;

    this.body = $("<div></div>");
    this.body.addClass("game_dialogBody");
    popup.append(this.body);

    this.show = function (parent) {
        switch(location){
            case 0:
                popup.css("top", (parent.offsetTop + ((parent.height - height) >> 1)) + "px");
                break;

            case 1:
                popup.css("top", (parent.offsetTop + 2) + "px");
                break;

            case 2:
                popup.css("top", (parent.offsetTop + (parent.height - height - 10)) + "px");
                break;
        }

        // Center the popup
        popup.css("left", (parent.offsetLeft + ((parent.width - width) >> 1)) + "px");
        

        // Attach the node
        $(parent).parent().append(popup);

        popup.show('fast', function(){
            if(_this.onresize){
                _this.onresize();
            }
        });
    };

    this.close = function () {
        popup.hide('fast', function () {
            popup.remove();
            _this.closeComplete();
        });
    };

    this.closeComplete = function () {
    };

    this.handleActions = function (actionList) {

    };

    this.animate = function (timeSinceLast) {

    };

    this.setTitle = function(title) {
        titleBar.text(title);
    }
}

function LoginMenu(loginFunction) {
    var menu = new GameMenu("Login", 300, 400, false, "login_menu");
    var passField = $("<input type='text' name='passcode' class='game_center passcode_input'></input>");
    var submit = $("<button class='game_center login_button'>Loading...</button>");
    submit[0].disabled = true;

    /*menu.body.css("position", "absolute");
     menu.body.css("left", "35px");
     menu.body.css("bottom", "20px");*/

    //menu.body.append($("<h3 class='game_center passcode_title'>Passcode</h3>"));
    //menu.body.append(passField);
    menu.body.append(submit);

    menu.userId = null;
    menu.username = null;

    passField.keypress(function (e) {
        var code = e.keyCode || e.which;

        if (code === 13) {
            e.preventDefault();
            submit.click();
            return false;
        }
    });

    submit.click(function () {
        var result = loginFunction(passField.val());
        if (result.isSuccessful) {
            menu.userId = result.userId;
            menu.userName = result.userName;
            menu.close();
        } else {
            // TODO: Show error
        }
    });

    setTimeout(function(){
        submit.text("Login");
        submit[0].disabled = false;
    }, 1000)

    menu.pauseGame = false;

    return menu;
}
// Pallete
var basePalette = {
    // Skin
    0x00ffffff: {r: 255, g: 255, b: 255},
    0x00d2d2d2: {r: 210, g: 210, b: 210},
    0x00808080: {r: 128, g: 128, b: 128},
    // Hair
    0x00ffc080: {r: 255, g: 192, b: 128},
    0x00ff8000: {r: 255, g: 128, b: 128},
    0x00804000: {r: 128, g: 64, b: 0},
    // Clothing 1
    0x00ff8080: {r: 255, g: 128, b: 128},
    0x00ff0000: {r: 255, g: 0, b: 0},
    0x00800000: {r: 128, g: 0, b: 0},
    // Clothing 2
    0x0080ff80: {r: 128, g: 255, b: 128},
    0x0000ff00: {r: 0, g: 255, b: 0},
    0x00008000: {r: 0, g: 128, b: 0},
    // Clothing 1
    0x008080ff: {r: 128, g: 128, b: 255},
    0x000000ff: {r: 0, g: 0, b: 255},
    0x00000080: {r: 0, g: 0, b: 128},
    // Eyes
    0x00ffff80: {r: 255, g: 255, b: 255},
    0x00ffff00: {r: 0, g: 0, b: 255},
    0x00808000: {r: 0, g: 0, b: 128}
};

function setPaletteColor(index, r, g, b) {
    var p = basePalette[index];

    if (p) {
        p.r = Math.min(Math.round(r), 255);
        p.g = Math.min(Math.round(g), 255);
        p.b = Math.min(Math.round(b), 255);
    }
}

// Some code is added to give auto model creation.
function CharacterSelectMenu(spriteSheets) {
    var menu = new GameMenu("Character Select", 332, 330);

    menu.sprites = [];
    menu.selected = 0;

    var animationTypes = ['down', 'up', 'left', 'right'];
    var direction = 0;

    menu.pauseGame = false;

    // Functions for updating the pallette
    function updatePallette(r, g, b, light, med, dark) {
        setPaletteColor(light, r * 2.0, g * 2.0, b * 1.8);
        setPaletteColor(med, r, g, b);
        setPaletteColor(dark, r * 0.7, g * 0.75, b * 0.8);

        for (var i in menu.sprites) {
            var sprite = menu.sprites[i];
            sprite.updateColorset();
        }
    }

    // Copy the spritesheets
    for (var i in spriteSheets) {
        var sprite = spriteSheets[i]; //TODO: Add copy function
        sprite.setPalette(basePalette);

        menu.sprites.push(sprite);
    }

    // Animaiton informaiton
    var frame = 0;
    var frameTime = 0;
    var dTime = 5000;

    // Setup the components
    var buttonLeft = $("<button class='button_left'>&lt;</button>");
    var buttonRight = $("<button class='button_right'>&gt;</button>");
    var canvas = $("<canvas style='background-color: rgba(0, 0, 0, 0);' width='80' height='120'></canvas>");
    var buttonSelect = $("<button>Select</button>");
    var buttonRandom = $("<button>Random</button>");

    var div = $("<div class='game_left'></div>");
    menu.body.append(div);
    div.append(buttonLeft);
    div.append(canvas);
    div.append(buttonRight);

    var colorSelectDiv = $("<div class='game_right'></div>");
    menu.body.append(colorSelectDiv);

    div = $("<div class='game_center' style='width: 320px; float: left;'></div>");
    menu.body.append(div);
    div.append(buttonSelect);
    div.append(buttonRandom);


    buttonLeft.click(function () {
        var selected = menu.selected - 1;
        if (selected < 0) {
            selected = menu.sprites.length + selected;
        }

        menu.selected = selected;
    });

    buttonRight.click(function () {
        var selected = menu.selected + 1;
        if (selected >= menu.sprites.length) {
            selected = selected - menu.sprites.length;
        }

        menu.selected = selected;
    });

    buttonSelect.click(function () {
        var sprite = menu.sprites[menu.selected];
        menu.characterSelected(sprite);

        menu.close();
    });

    buttonRandom.click(function () {
        $(colorSelectDiv).find('.color_select_div').each(function () {
            var colorOptions = $(this).find(".color_select");
            var option = Math.min(Math.round(Math.random() * colorOptions.length), colorOptions.length - 1);
            $(colorOptions[option]).click();
        });
    });

    // Picking colors    
    function addColorClickEvent(selector, light, med, dark, color) {
        selector.click(function (event) {
            selector.parent().find(".color_select.active").removeClass("active");
            selector.addClass("active");
            updatePallette(color.r, color.g, color.b, light, med, dark);
        });
    }

    function createColorSelector(light, med, dark, colorOptions) {
        var sectionDiv = $("<div class='color_select_div'></div>");

        for (var i = 0; i < colorOptions.length; ++i) {
            var colorOption = colorOptions[i];
            var colorItem = $("<div class='color_select'></div>");
            colorItem.css("background-color", "rgb(" + colorOption.r + ", " + colorOption.g + ", " + colorOption.b + ")");

            addColorClickEvent(colorItem, light, med, dark, colorOption)

            sectionDiv.append(colorItem);
        }
        colorSelectDiv.append(sectionDiv);
    }

    createColorSelector(0x00ffff80, 0x00ffff00, 0x00808000, [
        {r: 213, g: 236, b: 231},
        {r: 239, g: 231, b: 143},
        {r: 153, g: 229, b: 130},
        {r: 130, g: 229, b: 188},
        {r: 61, g: 68, b: 219},
        {r: 167, g: 93, b: 21},
        {r: 70, g: 47, b: 24},
        {r: 54, g: 54, b: 54}
    ]);

    createColorSelector(0x00ffc080, 0x00ff8000, 0x00804000, [
        {r: 235, g: 220, b: 206},
        {r: 218, g: 197, b: 150},
        {r: 212, g: 130, b: 92},
        {r: 163, g: 107, b: 92},
        {r: 80, g: 85, b: 114},
        {r: 120, g: 137, b: 141},
        {r: 109, g: 94, b: 105},
        {r: 78, g: 75, b: 68},
        {r: 54, g: 54, b: 54}
    ]);

    createColorSelector(0x00ffffff, 0x00d2d2d2, 0x00808080, [
        {r: 248, g: 213, b: 194},
        {r: 239, g: 187, b: 166},
        {r: 230, g: 170, b: 134},
        {r: 210, g: 148, b: 107},
        {r: 197, g: 143, b: 99},
        {r: 132, g: 87, b: 54},
        {r: 113, g: 80, b: 49},
        {r: 136, g: 86, b: 59}
    ]);

    var clothPalette = [
        {r: 230, g: 230, b: 230},
        {r: 229, g: 15, b: 15},
        {r: 244, g: 115, b: 29},
        {r: 248, g: 228, b: 9},
        {r: 29, g: 181, b: 9},
        {r: 9, g: 181, b: 163},
        {r: 36, g: 93, b: 222},
        {r: 137, g: 36, b: 222},
        {r: 54, g: 54, b: 54}
    ];
    createColorSelector(0x00ff8080, 0x00ff0000, 0x00800000, clothPalette);
    createColorSelector(0x0080ff80, 0x0000ff00, 0x00008000, clothPalette);
    createColorSelector(0x008080ff, 0x000000ff, 0x00000080, clothPalette);

    buttonRandom.click();

    // Animate and draw the character model
    animationTypes = ['down', 'left', 'up', 'right'];
    var context = canvas[0].getContext("2d");
    context.imageSmoothingEnabled = false;

    menu.animate = function (timeSinceLast) {
        var frames = menu.sprites[menu.selected].animations["walk_" + animationTypes[direction]].frames;
        var f = frames[frame];
        frameTime += timeSinceLast;

        while (frameTime > f.frameTime) {
            ++frame;
            if (frame >= frames.length) {
                frame = 0;
            }

            frameTime -= f.frameTime;
            f = frames[frame];
        }

        dTime -= timeSinceLast;
        if (dTime < 0) {
            dTime = 5000;
            ++direction;

            if (direction > 3) {
                direction = 0;
                frame = 0;
                frameTime = 0;
            }
        }

        context.clearRect(0, 0, 80, 120);
        context.drawImage(menu.sprites[menu.selected].image,
                f.x, f.y, f.width, f.height,
                0, 0, 80, 120);
    };

    menu.characterSelected = function (spriteSheet) {

    };

    return menu;
}

// Window to set the settings for the game
// States: 0 - main menu, 1 - General, 2 - Sound, 3 - Video
function SettingsWindow(game){
    var result = new GameMenu("", 300, 200);

    //Setup components
    var dialogSection = $("<div class='dialog_menu'></div>");
    result.body.append(dialogSection);

    // Component functions
    var addMenuItem = function(parent, name, content){
        var section = $("<li></li>");
        section.append($("<span class='menu-label'></span>").text(name));
        section.append($("<span class='menu-content'></span>").append(content));

        parent.append(section);
    };

    var addMenuSlider = function(parent, name, value, min, max, step, onchange){
        var slider = $("<input></input>");
        slider.attr("type", "range");
        slider.attr("min", min);
        slider.attr("max", max);
        slider.attr("step", step);
        slider.attr("value", value);

        slider.bind("change", function(ev){
            recordEvent("Settings", "SetValue", name, this.value);

            onchange.apply(this, arguments);
        });

        addMenuItem(parent, name, slider);
    }

    var addRadioGroup = function(parent, name, value, options, onchange){
        var inputName = name.replace(/\s/g, '');
        var radioGroup = $("<div></div>");

        for(var i = 0; i < options.length; ++i){
            var input = $("<input></input>");
            input.attr("type", "radio");
            input.attr("name", inputName);
            input.attr("value", options[i][0]);
            input.css("width", "auto");
            radioGroup.append(input);

            if(options[i][0] == value){
                input[0].checked = true;
            }

            var label = $("<span></span>");
            label.text(options[i][1]);
            radioGroup.append(label);

            input.change(function(){
                if(this.checked){
                    recordEvent("Settings", "SetValue", name, this.value);

                    onchange.apply(this, arguments);
                }
            })
        }

        addMenuItem(parent, name, radioGroup);
    }

    var addDropdownGroup = function(parent, name, value, options, onchange){
        var inputName = name.replace(/\s/g, '');
        var dropdown = $("<select></select>");

        slider.attr("value", value);

        for(var i = 0; i < options.length; ++i){
            
        }

        addMenuItem(parent, name, dropdown);
    }

    var addMenuChange = function(parent, name, menu){
        var li = $("<li></li>").text(name);
        li.click(function(){
            setMenu(menu);
        });

        parent.append(li);
    }

    var addMenuButtons = function(parent, names, functions){
        var button;
        var div = $("<div class='game_center' style='width: 320px; float: left;'></div>");

        for(var i = 0; i < names.length; ++i){
            button = $("<button></button>");
            button.text(names[i]);
            button.click(functions[i]);

            div.append(button);
        }

        parent.append(div)
    };

    var setMenu = function(state){
        dialogSection.empty();
        var menu = $("<ul class='game_center'></ul>");
        dialogSection.append(menu);

        switch(state){
            case 1:
                result.titleBar.text("General Settings");
                addRadioGroup(menu, "Memory Usage", ArcSettings.Current.general.memory, [
                        [LEVEL_LOW, "Low"],
                        [LEVEL_MED, "Medium"],
                        [LEVEL_HIGH, "High"],
                        [LEVEL_ULTRA, "Ultra"],
                    ], function(){
                        game.setMemoryLevel(this.value);
                        ArcSettings.Current.general.memory = this.value;
                    });
                addMenuButtons(dialogSection, ["Back"], [function(){ setMenu(0); }]);
                break;
            case 2:
                result.titleBar.text("Sound Settings");
                addMenuSlider(menu, "Volume", game.audio.getVolume() * 100, 0, 100, 1, 
                    function(){ 
                        game.audio.setVolume(this.value / 100);
                        console.log(game.audio.getVolume());
                    });
                addMenuButtons(dialogSection, ["Back"], [function(){ setMenu(0); }]);
                break;
            case 3:
                result.titleBar.text("Video Settings");
                add
                addMenuButtons(dialogSection, ["Back"], [function(){ setMenu(0); }]);
                break;
            default:
                result.titleBar.text("Settings");
                addMenuChange(menu, "General", 1);
                addMenuChange(menu, "Sound", 2);
                addMenuChange(menu, "Video", 3);
                addMenuButtons(dialogSection, ["Close"], [
                    function(){ 
                        ArcSettings.Current.save(game);
                        result.close();
                    }
                ]);
        }
    };

    setMenu(0);

    return result;
}

// Window for dialogs
function DialogMenu(dialog, name, lineNumber, player, speaker, location = 0) {
    var menu = new GameMenu("", 500, 310, false, false, location);
    var currentLine = null;
    var optionLabels = ["A) ", "B) ", "C) "];
    
    menu.variables = {
        player: player,
        speaker: speaker
    }

    // Setup the components
    var dialogSection = $("<div class='dialog_text'></div>");
    menu.body.append(dialogSection);

    var createOptionClick = function(index){
        return function(event){
            recordEvent("Dialog", "SelectOption", name + " - " + currentLine["LINE_NUMBER"], index);
            setLine(name, currentLine["OPTION_" + index + "_LINE"]);
            event.stopImmediatePropagation();
        };
    };

    var setLine = function (name, lineNumber) {
        recordEvent("Dialog", "SetLine", name, lineNumber);

        dialog.getDialog(name, lineNumber, function (result) {
            if (result === null) {
                console.log("Error loading dialog: " + name + " - " + lineNumber);
                menu.close();
            }

            let player = menu.variables.player;
            let speaker = menu.variables.speaker;

            if(result["ON_OPEN"]){
                eval(result["ON_OPEN"]);
            }
            dialogSection.empty();

            if(result["CHARACTER"] == "[CLOSE]"){
                menu.close();
            }

            var message = $("<h3></h3>");
            message.text(eval('`' + result["MESSAGE"] + '`'));
            dialogSection.append(message);

            // Add the options
            for (var i = 1; i < 4; ++i) {
                if (result["OPTION_" + i]) {
                    var option = $("<h4 class='dialog_option'></h4>");
                    option.text(optionLabels[i - 1] + result["OPTION_" + i]);
                    option.click(createOptionClick(i));
                    dialogSection.append(option);
                };
            }

            menu.titleBar.text(result["CHARACTER"]);

            currentLine = result;
        });
    };

    dialogSection.click(function (event) {
        if (currentLine === null) {
            menu.close();
        }

        /*TODO: if(result["ON_CLOSE"]){
            let player = menu.variables.player;
            let speaker = menu.variables.speaker;
            eval(result["ON_CLOSE"]);
        }*/

        // If there are options, check which one has been clicked
        if (currentLine["OPTION_1"] !== null) {
            // Do Nothing, this will be handled by each option
        } else if (currentLine["NEXT_LINE"] !== null) {
            // If there are no options, check if we advance to the next line.
            setLine(name, currentLine["NEXT_LINE"]);
        } else {
            // If there are no options, and no next line, close the dialog.
            menu.close();
        }
    });

    setLine(name, lineNumber);

    return menu;
}

// Basic Window for a Task
function TaskMenu(title, width, height) {
    var menu = new GameMenu(title, width, height);

    // Setup the components
    menu.canvas = $("<canvas style='background-color: rgba(0, 0, 0, 0);' width='" + width + "' height='" + (height - 50) + "'></canvas>")[0];
    menu.task = null;

    menu.body.append(menu.canvas);

    // Update the task as needed
    menu.animate = function (timeSinceLast) {
        if (menu.task != null) {
            let task = menu.task;

            menu.task.update(timeSinceLast);
            menu.task.draw(task.displayAdapter, task.drawModel)
        }
    }

    menu.onresize = function(){
        menu.task.resize(menu.body.innerWidth(), menu.body.innerHeight());
    }

    return menu;
}
