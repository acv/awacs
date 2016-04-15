/**
 * Created by acv on 2016-04-14.
 */

var AwacsApp = function ($) {
  var selectedMode;
  var modes = [
    "StdADFMode",
    "AdvDetADFMode",
    "AdvAirCombatMode",
    "AdvStrikeMode",
    "AdvInterdictMode"
  ];

  var playerSelector = (function () {
    var currentPlayer = "Allied";
    var listeners = [];
    var that = this;

    var getPlayerColor = function () {
      if (currentPlayer === "Allied") {
        return "royalblue"
      } else {
        return "red"
      }
    };

    var getOtherPlayerColor = function () {
      if (currentPlayer !== "Allied") {
        return "royalblue"
      } else {
        return "red"
      }
    };

    var signalListeners = function () {
      var numListener = listeners.length;
      for (var i = 0; i < numListener; i++) {
        listeners[i](that);
      }
    };

    var flipPlayer = function () {
      if (currentPlayer === 'Allied') {
        currentPlayer = 'OpFor';
      } else {
        currentPlayer = 'Allied';
      }
      $("#flag-box").css("background-color", getPlayerColor());
      signalListeners();
    };

    var initFlag = function () {
      $("#flag-box")
        .css('background-color', getPlayerColor())
        .on('click', function () {
          flipPlayer();
        });
    };

    return {
      'attachSection': function () {
        if (!$("#player-flag").length) {
          var html = "<div class=\"player\" id=\"player-flag\">\n<div class=\"flag-box\" id=\"flag-box\">\n" +
            "</div>\n</div>";
          $("#player-banner").prepend(html);
          initFlag();
        }
      },
      'attachListener': function (listener) {
        listeners.push(listener);
      },
      'getPlayerColor': function () {
        return getPlayerColor();
      },
      'getOtherPlayerColor': function () {
        return getOtherPlayerColor();
      }
    };
  })();

  var airSupTracks = (function () {
    var currentAirSup = "contested";
    var validAirSup = {
      'oppSupremacy': {'color': '#FF2000', 'label': 'Opponent Supremacy'},
      'oppSuperiority': {'color': '#FF3800', 'label': 'Opponent Superiority'},
      'oppAdvantage': {'color': '#FF5000', 'label': 'Opponent Advantage'},
      'contested': {'color': 'white', 'label': 'Contested'},
      'advantage': {'color': 'rgb(120, 170, 255)', 'label': 'Advantage'},
      'superiority': {'color': 'rgb(120, 150, 255)', 'label': 'Superiority'},
      'supremacy': {'color': 'rgb(120, 120, 255)', 'label': 'Supremacy'}
    };
    var listeners = [];

    var buildTrackHtml = function () {
      var types = [
        'oppSupremacy',
        'oppSuperiority',
        'oppAdvantage',
        'contested',
        'advantage',
        'superiority',
        'supremacy'
      ];
      var numTypes = types.length;
      var html = "<div class=\"air-sup-track\" id=\"air-sup-track\">\n" +
        "<ul class=\"air-sup-boxes\" id=\"air-sup-boxes\">\n";
      for (var i = 0; i < numTypes; i++) {
        html += "<li class=\"air-sup-box\" id=\"" + types[i] + "\">" + validAirSup[types[i]]['label'] + "</li>\n";
      }
      html += "</ul>\n</div>\n";
      return html;
    };

    var airSupBoxColor = function (level) {
      var color = validAirSup[level]['color'];
      if (color === undefined) {
        color = 'white'
      }
      return color;
    };

    var refreshAirSupTrack = function () {
      $("#air-sup-boxes").find(".air-sup-box").each(function (index, element) {
        var id = $(element).attr('id');
        if (id === currentAirSup) {
          $(element)
            .css('background-color', 'black')
            .css('color', 'white');
        } else {
          $(element)
            .css('background-color', airSupBoxColor(id))
            .css('color', 'black');
        }
      });
    };

    var airSupClickHandler = function (value) {
      currentAirSup = value;
      refreshAirSupTrack();
    };

    var initAirSupTrack = function () {
      $("#air-sup-boxes").find(".air-sup-box").each(function (index, element) {
        var id = $(element).attr('id');
        $(element).on('click', function () {
          airSupClickHandler(id);
        });
      });
    };

    var flipAirSupTrack = function () {
      var airSup = currentAirSup;
      if (airSup === 'contested') {
        return;  // Skip.
      }
      if (airSup.substr(0, 3) === 'opp') {
        airSup = airSup.substr(3).toLowerCase();
      } else {
        airSup = 'opp' + airSup.charAt(0).toUpperCase() + airSup.slice(1);
      }
      currentAirSup = airSup;
      refreshAirSupTrack();
    };

    return {
      'attachSection': function () {
        if (!$("#air-sup-track").length) {
          $("#player-banner").append(buildTrackHtml());
          initAirSupTrack();
          playerSelector.attachListener(flipAirSupTrack);
        }
        refreshAirSupTrack();
      },
      'attachListener': function (listener) {
        listeners.push(listener);
      },
      'getCurrentAirSupLevel': function () {
        return currentAirSup;
      }
    };
  })();

  var stdAdfDRMs = (function () {
    var drms = [
      {
        'name': 'dist-install',
        'type': 'check',
        'value': -2,
        'desc': 'Target within 2 hexes from Airfield, Installation or Naval Unit. (-2)',
        'caveat': undefined,
        'current': 0
      }, {
        'name': 'adj-mech',
        'type': 'check',
        'value': -1,
        'desc': 'Target is in or adjacent a hex containing enemy Armor or Mechanized unit (-1)',
        'caveat': '(Amphibiously assaulting units excepted).',
        'current': 0
      }, {
        'name': 'helo-over-enemy',
        'type': 'check',
        'value': -1,
        'desc': 'Attacker Helicopter/Airmobile unit flew over enemy unit (-1)',
        'caveat': '(not including target hex).',
        'current': 0
      }, {
        'name': 'escort-air-point',
        'type': 'drop',
        'max-count': 2,
        'value': 1,
        'desc': 'Escorting Air Points (max 2). (+1 each)',
        'caveat': undefined,
        'current': 0
      }, {
        'name': 'air-transport-friendly',
        'type': 'check',
        'value': 3,
        'desc': 'Mission is Air Transport in home or friendly country. (+3)',
        'caveat': undefined,
        'current': 0
      }
    ];
    var listeners = [];
    var that = this;  // Self reference.

    var getInputForDRM = function (drm) {
      var html = '';
      if (drm['type'] === 'check') {
        html += "<input type=\"checkbox\" id=\"" + drm['name'] + "-check\" class=\"drm-checkbox std-adf-drm\">\n";
      } else if (drm['type'] === 'drop') {
        html += "<input type=\"number\" id=\"" + drm['name'] + "-drop\" class=\"drm-drop std-adf-drm\" min=\"0\" " +
          "max=\"" + drm['max-count'] + "\" value=\"0\">\n";
      }
      return html;
    };

    var drmHtmlSnippets = function () {
      var arrayLength = drms.length;
      var html = '';
      for (var i = 0; i < arrayLength; i++) {
        html += "<li class=\"drm-modifier\" id=\"" + drms[i]['name'] + "\">\n";
        html += getInputForDRM(drms[i]);
        html += drms[i]['desc'];
        if (drms[i]['caveat'] !== undefined) {
          html += "<br>\n<span class=\"caveat\">" + drms[i]['caveat'] + "</span>";
        }
        html += "\n</li>\n";
      }
      return html;
    };

    var signalListenersOfDrmChange = function () {
      var numListener = listeners.length;
      for (var i = 0; i < numListener; i++) {
        listeners[i](that);
      }
    };

    var handleDrmChange = function (element) {
      var elementId = $(element).prop('id');
      var numDrm = drms.length;
      var drm;
      for (var i = 0; i < numDrm; i++) {
        var drmId = drms[i]['name'] + '-' + drms[i]['type'];
        if (drmId === elementId) {
          drm = drms[i];
          break;
        }
      }
      if (drm === undefined) {
        return;  // Not expected!
      }
      if (drm['type'] === 'check') {
        if ($(element).prop('checked')) {
          drm['current'] = 1;
        } else {
          drm['current'] = 0;
        }
      } else if (drm['type'] === 'drop') {
        drm['current'] = parseInt($(element).prop('value'));
        if (drm['current'] > drm['max-count']) {
          drm['current'] = drm['max-count'];
        }
      }
      signalListenersOfDrmChange();
    };

    var addChangeHandlers = function () {
      var arrayLength = drms.length;
      for (var i = 0; i < arrayLength; i++) {
        var elementId = drms[i]['name'] + '-' + drms[i]['type'];
        $("#" + elementId).on('change', function () {
          handleDrmChange(this);
        });
      }
    };

    return {
      'attachSection': function () {
        if (!$('.std-adf-modifiers').length) {
          var newHtml = "<div class=\"std-adf-modifiers modals std-adf-modals hidden\" id=\"std-adf-modifiers\">\n" +
            "<p class=\"heading\">DRMs</p>\n<ul class=\"drm-modifiers\" id=\"std-adf-drm\">" +
              drmHtmlSnippets() + "\n</ul>\n</div>";
          $(".selected-mode").prepend(newHtml);
          addChangeHandlers();
        }
      },
      'attachListener': function (listener) {
        listeners.push(listener);
      },
      'sumNetDRM': function () {
        var arrayLength = drms.length;
        var total = 0;
        for (var i = 0; i < arrayLength; i++) {
          if (drms[i]['current'] > 0) {
            total += drms[i]['current'] * drms[i]['value'];
          }
        }
        return total;
      },
      'resetDRMs': function () {
        var arrayLength = drms.length;
        for (var i = 0; i < arrayLength; i++) {
          drms[i]['current'] = 0;

        }
        $(".std-adf-drm").each(function (index, element) {
          if ($(element).hasClass('drm-checkbox')) {
            $(element).prop('checked', false);
          } else if ($(element).hasClass('drm-drop')) {
            $(element).prop('value', 0);
          }
        });
      }
    };
  })();

  var stdAdfResolver = (function () {
    var stdAdfResultTable = {
      'oppSupremacy': function (dieRoll) {
        if (dieRoll < 0) { return "<strong>*</strong>Abort (-4)"; }
        else if (dieRoll < 1) { return "<strong>*</strong>Abort (-3)"; }
        else if (dieRoll < 3) { return "<strong>*</strong>Abort (-2)"; }
        else if (dieRoll < 4) { return "<strong>*</strong>Abort (-1)"; }
        else if (dieRoll < 9) { return "Abort (-1)"; }
        else { return "\u2014"; }
      },
      'oppSuperiority': function (dieRoll) {
        if (dieRoll < 0) { return "<strong>*</strong>Abort (-3)"; }
        else if (dieRoll < 2) { return "<strong>*</strong>Abort (-2)"; }
        else if (dieRoll < 3) { return "<strong>*</strong>Abort (-1)"; }
        else if (dieRoll < 7) { return "Abort (-1)"; }
        else { return "\u2014"; }
      },
      'oppAdvantage': function (dieRoll) {
        if (dieRoll < 0) { return "<strong>*</strong>Abort (-3)"; }
        else if (dieRoll < 1) { return "<strong>*</strong>Abort (-2)"; }
        else if (dieRoll < 2) { return "<strong>*</strong>Abort (-1)"; }
        else if (dieRoll < 5) { return "Abort (-1)"; }
        else { return "\u2014"; }
      },
      'contested': function (dieRoll) {
        if (dieRoll < 0) { return "<strong>*</strong>Abort (-2)"; }
        else if (dieRoll < 1) { return "<strong>*</strong>Abort (-1)"; }
        else if (dieRoll < 3) { return "Abort (-1)"; }
        else { return "\u2014"; }
      },
      'advantage': function (dieRoll) {
        if (dieRoll < 0) { return "<strong>*</strong>Abort (-1)"; }
        else if (dieRoll < 2) { return "Abort (-1)"; }
        else { return "\u2014"; }
      },
      'superiority': function (dieRoll) {
        if (dieRoll < 1) { return "Abort (-1)"; }
        else { return "\u2014"; }
      },
      'supremacy': function (dieRoll) {
        if (dieRoll < 0) { return "Abort (-1)"; }
        else { return "\u2014"; }
      }
    };
    var currentModifiers = 0;

    var updateDrmDisplay = function () {
      currentModifiers = stdAdfDRMs.sumNetDRM();
      var displayValue = '';
      if (currentModifiers < 0) {
        displayValue = currentModifiers.toString();
      } else {
        displayValue = "+" + currentModifiers.toString();
      }
      $("#std-adf-net-drm-value").html(displayValue);
    };

    var drmListener = function () {
      updateDrmDisplay();
    };

    var resolveAdfEffect = function (netDieRoll) {
      var column = stdAdfResultTable[airSupTracks.getCurrentAirSupLevel()];
      return column(netDieRoll);
    };

    var resolveAdf = function () {
      var adfRoll = rollDie(currentModifiers);
      var html = "<p class=\"result-label\">Die Roll</p><p class=\"value\">" + adfRoll['raw-roll'] + "</p><br>\n" +
          "<p class=\"result-label\">Net Roll</p><p class=\"value\">" + adfRoll['net-roll'] + "</p><br>\n" +
          "<p class=\"result-label\">Effect</p><p class=\"value\">" + resolveAdfEffect(adfRoll['net-roll']) + "</p>\n";
      $("#std-adf-result").html(html);
    };

    var addResolutionHandler = function () {
      $("#std-adf-dice-roll-button").on('click', function () {
        resolveAdf();
      });
    };

    var resetResults = function () {
      $("#std-adf-result").html("&nbsp;");
    };

    return {
      'attachSection': function () {
        if (!$('.std-adf-resolution').length) {
          var newHtml = "<div class=\"std-adf-resolution modals std-adf-modals hidden\" id=\"std-adf-resolution\">\n" +
            "<p class=\"heading\">Resolution</p>\n<div id=\"std-adf-drm-display\" class=\"std-adf-drm-display\">" +
            "<p class=\"result-label\">Current Net DRM:</p><p class=\"value\" id=\"std-adf-net-drm-value\">+0</p>" +
            "</div><input type=\"button\" class=\"dice-roll-button\" " +
            "id=\"std-adf-dice-roll-button\" value=\"Roll Die\">\n<div class=\"std-adf-result\" " +
            "id=\"std-adf-result\">&nbsp;</div></div>\n";
          $(".selected-mode").append(newHtml);
          stdAdfDRMs.attachListener(drmListener);
          addResolutionHandler();
        }
        updateDrmDisplay();
        resetResults();
      }
    };
  })();

  var adfTracks = (function () {
    var adfDetection = 6;
    var adfSAM = 6;
    var adfAAA = 2;

    var listeners = [];

    var trackLabels = {
      'det': 'Detection',
      'sam': 'SAM',
      'aaa': 'AAA'
    };

    var buildTrackHtml = function (type, numBoxes) {
      var html = "<div class=\"track\" id=\"" + type + "-track\">\n" +
        "<p class=\"label\" id=\"" + type + "-label\">" + trackLabels[type] + "</p>\n" +
        "<ul class=\"boxes\" id=\"" + type + "-boxes\">\n";
      for (var i = 0; i < numBoxes; i++) {
        var boxNum = i + 1;
        html += "<li class=\"box\" id=\"" + type + "-box-" + boxNum + "\">" + boxNum + "</li>\n";
      }
      html += "</ul>\n</div>\n";
      return html;
    };

    var refreshAdfTracks = function () {
      $("#adf-tracks").find(".box").each(function (index, element) {
        var id = $(element).attr("id").split('-');
        var value = parseInt(id[2]);
        if (id[0] === "det") {
          if (value === adfDetection) {
            $(element).css('background-color', playerSelector.getOtherPlayerColor());
          } else {
            $(element).css('background-color', "white");
          }
        } else if (id[0] === "sam") {
          if (value === adfSAM) {
            $(element).css('background-color', playerSelector.getOtherPlayerColor());
          } else {
            $(element).css('background-color', "white");
          }

        } else if (id[0] === 'aaa') {
          if (value === adfAAA) {
            $(element).css('background-color', playerSelector.getOtherPlayerColor());
          } else {
            $(element).css('background-color', "white");
          }

        }
      });
    };

    var adfClickHandler = function (track, value) {
      if (track === 'adfDetection') {
        adfDetection = parseInt(value);
      } else if (track === 'adfSAM') {
        adfSAM = parseInt(value);
      } else if (track === 'adfAAA') {
        adfAAA = parseInt(value);
      }
      refreshAdfTracks();
    };

    var addHandlersToTrackBoxes = function () {
      $("#adf-tracks").find(".box").each(function (index, element) {
        var id = $(element).attr("id").split('-');
        var value = parseInt(id[2]);
        var track;
        if (id[0] === 'det') {
          track = 'adfDetection';
        } else if (id[0] === 'sam') {
          track = 'adfSAM';
        } else if (id[0] === 'aaa') {
          track = 'adfAAA';
        }
        $(element).on('click', function () {
          adfClickHandler(track, value);
        });
      });
    };

    return {
      'attachSection': function () {
        if (!$("#adf-tracks").length) {
          var html = "<div class=\"adf-tracks modals hidden\" id=\"adf-tracks\">\n" +
            buildTrackHtml('det', 10) + buildTrackHtml('sam', 10) + buildTrackHtml('aaa', 3) +
            "</div>\n";
          $(".selected-mode").append(html);
          addHandlersToTrackBoxes();
          airSupTracks.attachListener(function () {
            refreshAdfTracks();
          });
        }
        refreshAdfTracks();
      },
      'attachListener': function (listener) {
        listeners.push(listener);
      }
    };
  })();

  var rollDie = function (modifier) {
    if (modifier === undefined) {
      modifier = 0;
    }
    var roll = Math.floor(Math.random() * 10);
    return {
      'modifier': modifier,
      'raw-roll': roll,
      'net-roll': roll + modifier
    };
  };

  var resetAllModals = function () {
    $(".modals").each(function (index, element) {
      if (!$(element).hasClass('hidden')) {
        $(element).addClass('hidden');
      }
    });
  };

  var initStdAdfMode = function () {
    stdAdfDRMs.attachSection();
    stdAdfDRMs.resetDRMs();
    stdAdfResolver.attachSection();
    $('.std-adf-modals').removeClass('hidden');
  };
  
  var initSelectedMode = function () {
    if (selectedMode === 'StdADFMode') {
      initStdAdfMode();
    }
  };

  var changeMode = function (mode) {
    if (selectedMode != null) {
      var m = selectedMode;
      $('#' + selectedMode)
        .removeClass('selected')
        .on("click", function () { changeMode(m); });
    }
    resetAllModals();
    selectedMode = mode;
    $('#' + mode)
      .addClass('selected')
      .off("click");
    initSelectedMode();
  };

  var init = function () {
    $("#modes").find("li").each(function (index, element) {
      var elementMode = $(element).attr('id');
      if (element.classList.contains('selected')) {
        selectedMode = elementMode;
      } else {
        $(element).on('click', function () { changeMode(elementMode); });
      }
    });

    playerSelector.attachSection();
    airSupTracks.attachSection();
    adfTracks.attachSection();

    if (selectedMode == null) {
      changeMode("StdADFMode");
    }
  };

  init();
};