/**
 * Created by acv on 2016-04-14.
 *
 * MIT Licensed.
 */

var AwacsApp = function ($) {
  var selectedMode;
  var modes = [
    "StdADFMode",
    "AdvDetMode",
    "AdvADFMode",
    "AdvAirCombatMode",
    "AdvStrikeMode",
    "AdvInterdictMode"
  ];

  var createDrms = function (prefix, drms, optLabel, optAutoDrm) {
    var listeners = [];
    var that = this;  // Self reference.
    var label = "DRMs";
    var autoDrm = 0;

    if (optLabel !== undefined) {
      label = optLabel;
    }

    if (optAutoDrm !== undefined) {
      autoDrm = optAutoDrm;
    }

    var formatModifier = function (num) {
      var formatted = num.toString();
      if (num > -1) {
        formatted = "+" + formatted;
      }
      return formatted;
    };

    var getRangeOptions = function (prefix, min, max) {
      var html = "";
      for (var i = min; i <= max; i++) {
        html += "<li class=\"drop-down-choice\" id=\"" + prefix + '_' + i + "\">" + formatModifier(i) + "</li>\n";
      }
      return html;
    };

    var getInputForDRM = function (drm) {
      var html = '';
      if (drm['type'] === 'check') {
        html += "<input type=\"checkbox\" id=\"" + drm['name'] + "-check\" class=\"drm-checkbox " + prefix + "-drm\">\n";
      } else if (drm['type'] === 'drop') {
        var minCount = drm['min-count'];
        if (minCount === undefined) {
          minCount = 0;
        }
        //html += "<input type=\"number\" id=\"" + drm['name'] + "-drop\" class=\"drm-drop " + prefix + "-drm\" min=\"" +
        //  minCount + "\" max=\"" + drm['max-count'] + "\" value=\"0\">\n";
        html += "<div class=\"drm-drop\" id=\"" + drm['name'] + "-drop\">+0</div>\n" +
          "<ul id=\"" + drm['name'] + "-options\" class=\"floating-dropdown\">" +
          getRangeOptions(drm['name'], minCount, drm['max-count']) +
          "</ul>\n";
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
        drm['current'] = parseInt($(element).html());
        if (drm['current'] > drm['max-count']) {
          drm['current'] = drm['max-count'];
        }
        if (drm['min-count'] !== undefined) {
          if (drm['current'] < drm['min-count']) {
            drm['current'] = drm['min-count'];
          }
        }
      }
      signalListenersOfDrmChange();
    };

    var dropNumberClickHandler = function () {
      var myId = $(this).prop('id');
      var idSplit = myId.split('-');
      idSplit[idSplit.length - 1] = "options";
      var parentId = idSplit.join('-');
      var boxSelector = $("#" + parentId);
      if (boxSelector.css('display') === 'none') {
        boxSelector.css('display', 'block');
      } else {
        boxSelector.css('display', 'none');
      }
    };

    var numberSelectedClickHandler = function () {
      var splitId = $(this).prop('id').split('_');
      var parentSelector = $("#" + splitId[0] + "-drop");
      parentSelector.html(formatModifier(splitId[1]));
      parentSelector.click();
      parentSelector.change();
    };

    var addChangeHandlers = function () {
      var arrayLength = drms.length;
      for (var i = 0; i < arrayLength; i++) {
        var elementId = drms[i]['name'] + '-' + drms[i]['type'];
        var elementSelector = $("#" + elementId);
        elementSelector.on('change', function () {
          handleDrmChange(this);
        });
        if (drms[i]['type'] === 'drop') {
          var prefix = drms[i]['name'];
          elementSelector.on('click', dropNumberClickHandler);
          var minCount = drms[i]['min-count'];
          if (minCount === undefined) {
            minCount = 0;
          }
          var maxCount = drms[i]['max-count'];
          for (var j = minCount; j <= maxCount; j++) {
            $("#" + prefix + '_' + j).on('click', numberSelectedClickHandler);
          }
        }
      }
    };

    return {
      'attachSection': function (selector) {
        if (selector === undefined) {
          selector = ".selected-mode";
        }
        if (!$('#' + prefix + '-modifiers').length) {
          var newHtml = "<div class=\"" + prefix + "-modifiers modals " + prefix + "-modals\" id=\"" + prefix +
            "-modifiers\">\n<p class=\"heading\">" + label + "</p>\n<ul class=\"drm-modifiers\" id=\"" + prefix + "-drm\">" +
            drmHtmlSnippets() + "\n</ul>\n</div>";
          $(selector).append(newHtml);
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
          if (drms[i]['current'] != 0) {
            total += drms[i]['current'] * drms[i]['value'];
          }
        }
        return total + autoDrm;
      },
      'resetDRMs': function () {
        var arrayLength = drms.length;
        for (var i = 0; i < arrayLength; i++) {
          drms[i]['current'] = 0;

        }
        $("." + prefix + "-drm").each(function (index, element) {
          if ($(element).hasClass('drm-checkbox')) {
            $(element).prop('checked', false);
          } else if ($(element).hasClass('drm-drop')) {
            $(element).prop('value', 0);
          }
        });
      },
      'removeDRMs': function () {
        $("#" + prefix + "-modifiers").remove();
      }
    };
  };

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

  var stdAdfMode = (function () {
    return {
      'init': function () {
        stdAdfDRMs.attachSection();
        stdAdfDRMs.resetDRMs();
        stdAdfResolver.attachSection();
        $('.std-adf-modals').removeClass('hidden');
      }
    }
  })();

  var stdAdfDRMs = createDrms("std-adf", [
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
  ]);

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

  var advDetMode = (function () {
    var missionTypeSelected = false;
    var useLocalAdf = false;
    var missionWasDetected = false;
    var adfTrackToUse;
    var trackLabels = {
      'NormalADF': 'Standard ADF Track',
      'NormalADFNoShoot': 'Standard ADF Track, no SAM or AAA (SR 25.1 #3b)',
      'NormalOrNavalADF': 'Choose Naval or Standard ADF',
      'OptNormalOrNavalADF': 'Naval Umbrella, mix and match Standard and Naval ADF tracks, ' +
        'Naval aircrafts can intercept on D results.',
      'NavalADF': 'Naval ADF Track',
      'NavalADFED': 'Naval ADF Track (always Early Detection)',
      'LocalADF': 'Local ADF in use',
      'AlwaysSuccess': 'Mission Always Succeeds'
    };

    var adfTrackListener = function (track) {
      adfTrackToUse = track;
      useLocalAdf = track === 'LocalADF';

      missionTypeSelected = true;
      detectionDrms.removeDRMs();
      detectionResolver.removeResolver();
      drawRequiredSections();
    };

    var drawRequiredSections = function () {
      if (!missionTypeSelected) {
        missionTypeSelector.attachSection();
        missionTypeSelector.attachListener(adfTrackListener);
      }
      if (missionTypeSelected) {
        $("#adf-track-selected").remove();
        $("#adf-tracks").remove();
        $(".selected-mode").append("<p class=\"heading\" id=\"adf-track-selected\">" + trackLabels[adfTrackToUse] +
          "</p>\n");
        if (adfTrackToUse === 'AlwaysSuccess') {
          return;  // Skip all further, we're done.
        }
        if (!useLocalAdf) {
          adfTracks.attachSection();
        }
        detectionDrms.resetDRMs();
        detectionDrms.attachSection();
        detectionResolver.attachSection(adfTrackToUse);
      }
    };

    return {
      'init': function () {
        useLocalAdf = false;
        missionTypeSelected = false;
        missionWasDetected = false;
        drawRequiredSections();
      }
    };
  })();

  var missionTypeSelector = (function () {
    var missionTypes = [
      {
        'name': 'ground-strike',
        'label': 'Air Strike / Combat Support',
        'secondary': [
          {
            'name': 'enemy-space',
            'label': 'Enemy Country or w/i 2 hexes of enemy HQ',
            'track': function () { return 'NormalADF'; }
          },{
            'name': 'naval-umbrella',
            'label': 'w/i Naval Umbrella (NW Supplement #1)',
            'track': function () { return 'OptNormalOrNavalADF'; }
          },{
            'name': 'other-adf',
            'label': 'Other',
            'track': function () { return 'LocalADF'; }
          }
        ]
      },{
        'name': 'helo',
        'label': 'Helicopter / Airmobile',
        'secondary': [
          {
            'name': 'local-adf',
            'label': 'Always Local ADF',
            'track': function () { return 'LocalADF'; }
          }
        ]
      },{
        'name': 'air-transport',
        'label': 'Air Transport / Paradrop',
        'secondary': [
          {
            'name': 'enemy-space',
            'label': 'Enemy Country',
            'track': function () { return 'NormalADF'; }
          },{
            'name': 'friendly-near-hq',
            'label': 'Friendly Country w/i 2 hexes of enemy HQ',
            'track': function () {
              var airSup = airSupTracks.getCurrentAirSupLevel();
              var enemySup = false;
              if (airSup.substr(0, 3) === 'opp') {
                enemySup = true;
              }
              if (enemySup) {
                return "NormalADF";
              } else {
                return "LocalADF";
              }
            }
          },{
            'name': 'friendly-no-hq',
            'label': 'Friendly Country not w/i 2 hexes of enemy HQ',
            'track': function () {
              var airSup = airSupTracks.getCurrentAirSupLevel();
              var enemySup = false;
              if (airSup.substr(0, 3) === 'opp') {
                enemySup = true;
              }
              if (enemySup) {
                return "NormalADFNoShoot";
              } else {
                return "AlwaysSuccess";
              }
            }
          }
        ]
      },{
        'name': 'naval-strike',
        'label': 'Naval Strike',
        'secondary': [
          {
            'name': 'detected-all-sea',
            'label': 'Detected Naval in All-Sea hex',
            'track': function () { return 'NormalOrNavalADF'; }
          },{
            'name': 'detected-at-sea',
            'label': 'Detected Naval in In-Shore, At-Sea or Sea box',
            'track': function () { return 'NavalADFED'; }
          }
        ]
      },{
        'name': 'mining',
        'label': 'Aerial Mining',
        'secondary': [
          {
            'name': 'coastal-mining',
            'label': 'Along enemy coast, adj. Naval unit or w/i 2 hexes HQ',
            'track': function () { return 'NormalADF'; }
          },{
            'name': 'mining-umbrella',
            'label': 'w/i Naval Umbrella (NW Supplement #1)',
            'track': function () { return 'OptNormalOrNavalADF'; }
          },{
            'name': 'other-mining',
            'label': 'Other',
            'track': function () { return 'LocalADF'; }
          }
        ]
      }
    ];
    var currentMission;
    var currentTarget;
    var listeners = [];

    var buildTypesHtml = function () {
      var html = "<p class=\"heading\">Define Mission Type</p>\n<ul class=\"mission-types\" id=\"mission-types\">\n";

      var numMissions = missionTypes.length;
      for (var i = 0; i < numMissions; i++) {
        html += "<li id=\"" + missionTypes[i]['name'] + "\" class=\"mission-type\">" + missionTypes[i]['label'] +
          "</li>\n";
      }

      html += "</ul>\n";
      return html;
    };

    var missionTypeIndex = function (type) {
      var len = missionTypes.length;
      for (var i = 0; i < len; i++) {
        if (missionTypes[i]['name'] === type) {
          return i;
        }
      }
    };

    var showSelectedTargetType = function (type) {
      $(".target-type").each(function (index, element) {
        var elementId = $(element).prop('id');
        if (elementId === type) {
          $(element).addClass('selected');
        } else {
          if ($(element).hasClass('selected')) {
            $(element).removeClass('selected');
          }
        }
      });
    };

    var signalTrackSelected = function (adfTrack) {
      var numListeners = listeners.length;
      for (var i = 0; i < numListeners; i++) {
        listeners[i](adfTrack);
      }
    };

    var clickHandlerTarget = function (type) {
      currentTarget = type;
      showSelectedTargetType(type);
      var secondary = missionTypes[missionTypeIndex(currentMission)]['secondary'];
      var numTypes = secondary.length;
      for (var i = 0; i < numTypes; i++) {
        if (type === secondary[i]['name']) {
          var adfTrack = secondary[i]['track']();
          signalTrackSelected(adfTrack);
        }
      }
    };

    var addClickHandlersTarget = function () {
      var secondary = missionTypes[missionTypeIndex(currentMission)]['secondary'];
      var numTypes = secondary.length;
      for (var i = 0; i < numTypes; i++) {
        $("#" + secondary[i]['name']).on('click', function () {
          clickHandlerTarget($(this).prop('id'));
        });
      }
    };

    var updateSecondary = function () {
      if (currentMission === undefined) {
        return;  // Currently no-op.
      }
      adfTracks.removeTracks();
      detectionDrms.removeDRMs();
      detectionResolver.removeResolver();
      var secondary = missionTypes[missionTypeIndex(currentMission)]['secondary'];
      var html = '';

      currentTarget = undefined;

      if (!$("#target-type-heading").length) {
        html += "<p class=\"heading\" id=\"target-type-heading\">Select Target Type</p>";
      }

      $("#target-types").remove();
      html += "<ul class=\"target-types\" id=\"target-types\">\n";
      var secLen = secondary.length;
      for (var i = 0; i < secLen; i++) {
        html += "<li class=\"target-type\" id=\"" + secondary[i]['name'] + "\">" + secondary[i]['label'] + "</li>\n";
      }
      html += "</ul>\n";
      $(".selected-mode").append(html);
      addClickHandlersTarget();
    };

    var showSelectedMissionType = function (type) {
      $(".mission-type").each(function (index, element) {
        var elementId = $(element).prop('id');
        if (elementId === type) {
          $(element).addClass('selected');
        } else {
          if ($(element).hasClass('selected')) {
            $(element).removeClass('selected');
          }
        }
      });
    };

    var clickHandlerMission = function (type) {
      currentMission = type;
      showSelectedMissionType(type);
      updateSecondary();
    };

    var addClickHandlersMission = function () {
      var numTypes = missionTypes.length;
      for (var i = 0; i < numTypes; i++) {
        $("#" + missionTypes[i]['name']).on('click', function () {
          clickHandlerMission($(this).prop('id'));
        });
      }
    };

    return {
      'attachSection': function () {
        if (!$('.adv-adf-mission-type').length) {
          currentMission = undefined;
          var html = "<div class=\"adv-adf-mission-type\" id=\"adv-adf-mission-type\">\n" +
            buildTypesHtml() + "</div>\n";
          $(".selected-mode").append(html);
          addClickHandlersMission();
        }
        updateSecondary();
      },
      'attachListener': function (listener) {
        listeners.push(listener);
      }
    }
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
      'attachSection': function (selector) {
        if (selector === undefined) {
          selector = ".selected-mode";
        }
        if (!$("#adf-tracks").length) {
          var html = "<div class=\"adf-tracks modals\" id=\"adf-tracks\">\n" +
            buildTrackHtml('det', 10) + buildTrackHtml('sam', 10) + buildTrackHtml('aaa', 3) +
            "</div>\n";
          $(selector).append(html);
          addHandlersToTrackBoxes();
          airSupTracks.attachListener(function () {
            refreshAdfTracks();
          });
          playerSelector.attachListener(function () {
            refreshAdfTracks();
          });
        }
        refreshAdfTracks();
      },
      'removeTracks': function () {
        $("#adf-tracks").remove();
        $("#adf-track-selected").remove();
      },
      'attachListener': function (listener) {
        listeners.push(listener);
      },
      'getCurrentDetection': function () {
        return adfDetection;
      },
      'getCurrentSam': function () {
        return adfSAM;
      },
      'getCurrentAAA': function () {
        return adfAAA;
      }
    };
  })();

  var detectionDrms = createDrms("adv-det", [
      {
        'name': 'target-near-hq',
        'type': 'check',
        'value': -1,
        'desc': 'Target within 2 hexes from Detecting player\'s HQ (-1)',
        'current': 0
      },{
        'name': 'helo-through-hex',
        'type': 'check',
        'value': -1,
        'desc': 'Attack Helicopter/Airmobile Movement passed through Detecting Players\'s occupied hex (-1)',
        'current': 0
      },{
        'name': 'per-wild-weasel',
        'type': 'drop',
        'max-count': 4,  // Better safe than sorry, can't tell if limit is 2 or 4.
        'value': 1,
        'desc': 'Number Wild Weasel units included in mission (+1 each)',
        'current': 0
      },{
        'name': 'versus-transport',
        'type': 'check',
        'value': 1,
        'desc': 'Detection of Transport/paradrop/Combat Support missions (+1)',
        'current': 0
      },{
        'name': 'weather-overcast',
        'type': 'check',
        'value': 1,
        'desc': 'Weather is Overcast (+1)',
        'current': 0
      },{
        'name': 'mountain-hex',
        'type': 'check',
        'value': 1,
        'desc': 'Mission hex in Mountain/high Mountain hex (+1, NWIP only)',
        'current': 0
      },{
        'name': 'all-sealth',
        'type': 'check',
        'value': 5,
        'desc': 'Mission composed solely of "Stealth" units. (+5)',
        'current': 0
      },{
        'name': 'def-awacs-4',
        'type': 'check',
        'value': -3,
        'desc': 'Defender has AWACS Advantage of "4" (PRC restrictions in NWT) (-3)',
        'current': 0
      },{
        'name': 'def-awacs-3',
        'type': 'check',
        'value': -2,
        'desc': 'Defender has AWACS Advantage of "3" (PRC restrictions in NWT) (-2)',
        'current': 0
      },{
        'name': 'def-awacs-2',
        'type': 'check',
        'value': -1,
        'desc': 'Defender has AWACS Advantage of "2" (PRC restrictions in NWT) (-1)',
        'current': 0
      }
    ], "Detection DRMs");

  var detectionResolver = (function () {
    var detectionModifiers = {
      'NavalADFED': function (result) {
        if (result === 'D') {
          return 'ED (orig. D, per SR 17.1.4 #3)';
        }
        return result;
      }
    };
    var useLocalDetection = false;
    var detectionModifierInUse;
    var detectionTable = {
      'local': ['D','D','D'],
      0: ['ED', 'D', 'D'],
      1: ['ED', 'D', 'D'],
      2: ['ED', 'D', 'D', 'D'],
      3: ['ED', 'D', 'D', 'D'],
      4: ['ED', 'ED', 'D', 'D', 'D'],
      5: ['ED', 'ED', 'D', 'D', 'D', 'D'],
      6: ['ED', 'ED', 'ED', 'D', 'D', 'D', 'D'],
      7: ['ED', 'ED', 'ED', 'D', 'D', 'D', 'D', 'D'],
      8: ['ED', 'ED', 'ED', 'ED', 'D', 'D', 'D', 'D'],
      9: ['ED', 'ED', 'ED', 'ED', 'D', 'D', 'D', 'D', 'D'],
      10: ['ED', 'ED', 'ED', 'ED', 'ED', 'D', 'D', 'D', 'D']
    };
    var currentDrm = 0;

    var resolveDetection = function () {
      var dieRoll = rollDie(currentDrm);
      var detection;
      if (useLocalDetection) {
        detection = 'local';
      } else {
        detection = adfTracks.getCurrentDetection();
      }
      var roll = dieRoll['net-roll'];
      if (roll < 0) {
        roll = 0;
      }
      var rawResult = detectionTable[detection][roll];
      var netResult = detectionModifierInUse(rawResult);
      if (netResult === undefined) {
        netResult = "\u2014";
      }
      var html = "<p class=\"result-label\">Die Roll</p><p class=\"value\">" + dieRoll['raw-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Net Roll</p><p class=\"value\">" + dieRoll['net-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Effect</p><p class=\"value\">" + netResult + "</p>\n";
      $("#adv-det-result").html(html);
    };

    var updateDrmDisplay = function () {
      currentDrm = detectionDrms.sumNetDRM();
      var currentDrmString;
      if (currentDrm < 0) {
        currentDrmString = currentDrm.toString();
      } else {
        currentDrmString = "+" + currentDrm.toString();
      }
      $("#adv-det-net-drm-value").html(currentDrmString);
    };

    var initTrackEffect = function (adfTrack) {
      if (adfTrack === 'LocalADF') {
        useLocalDetection = true;
      }
      detectionModifierInUse = detectionModifiers[adfTrack];
      if (detectionModifierInUse === undefined) {
        detectionModifierInUse = function (result) { return result; };
      }
    };

    var addResolutionHandler = function () {
      $("#adv-det-dice-roll-button").on('click', function () {
        resolveDetection();
      });
    };

    var resetResults = function () {
      $("#adv-det-result").html("&nbsp;");
    };

    var setupDrmListener = function () {
      detectionDrms.attachListener(function () {
        updateDrmDisplay();
      });
    };

    return {
      'attachSection': function (adfTrack) {
        initTrackEffect(adfTrack);

        if (!$('.adv-det-resolution').length) {
          var newHtml = "<div class=\"adv-det-resolution modals adv-det-modals\" id=\"adv-det-resolution\">\n" +
            "<p class=\"heading\">Detection Resolution</p>\n<div id=\"adv-det-drm-display\" class=\"adv-det-drm-display\">" +
            "<p class=\"result-label\">Current Net DRM:</p><p class=\"value\" id=\"adv-det-net-drm-value\">+0</p>" +
            "</div><input type=\"button\" class=\"dice-roll-button\" " +
            "id=\"adv-det-dice-roll-button\" value=\"Roll Die\">\n<div class=\"adv-det-result\" " +
            "id=\"adv-det-result\">&nbsp;</div></div>\n";
          $(".selected-mode").append(newHtml);
          addResolutionHandler();
          setupDrmListener();
        }
        updateDrmDisplay();
        resetResults();
      },
      'removeResolver': function () {
        $(".adv-det-modals").remove();
      }
    };
  })();

  var advAdfMode = (function () {
    var modes = {
      'adv-adf-selector-normal-early': {
        'intercept': 'Air Interception Possible',
        'adfTrack': 'NormalADF',
        'sam': true,
        'aaa': true,
        'ciws': false
      },
      'adv-adf-selector-normal-normal': {
        'intercept': 'Air Interception Not Possible',
        'adfTrack': 'NormalADF',
        'sam': true,
        'aaa': true,
        'ciws': false
      },
      'adv-adf-selector-normal-none': {
        'intercept': 'Air Interception Not Possible',
        'adfTrack': 'NormalADF',
        'sam': false,
        'aaa': true,
        'ciws': false
      },
      'adv-adf-selector-naval-early': {
        'intercept': 'Air Interception Possible (Naval Aircraft Only)',
        'adfTrack': 'NavalADF',
        'sam': true,
        'aaa': false,
        'ciws': true
      },
      'adv-adf-selector-naval-none': {
        'intercept': 'Air Interception Not Possible',
        'adfTrack': 'NavalADF',
        'sam': false,
        'aaa': false,
        'ciws': true
      },
      'adv-adf-selector-local-normal': {
        'intercept': 'Air Interception Not Possible',
        'adfTrack': 'LocalADF',
        'sam': true,
        'aaa': true,
        'ciws': false
      },
      'adv-adf-selector-local-none': {
        'intercept': 'Air Interception Not Possible',
        'adfTrack': 'LocalADF',
        'sam': false,
        'aaa': true,
        'ciws': false
      }
    };
    var adfTrackConfigs = {
      'NormalADF': {
        'label': "Standard ADF track in Use",
        'show-track': true
      },
      'NavalADF': {
        'label': "Naval ADF track in Use <span class=\"adf-mode-caveat\">" +
          "(Standard ADF track can also be used if Naval Umbrella rule in use)</span>",
        'show-track': true
      },
      'LocalADF': {
        'label': "Local ADF track in Use",
        'show-track': false
      }
    };
    var currentMode;
    var samFired = false;

    var addAdfTrackHtml = function () {
      var adfTrackToUse = adfTrackConfigs[currentMode['adfTrack']];
      var trackHtml = "<p class=\"heading\" id=\"adf-track-name\">" + adfTrackToUse['label'] + "</p>";
      $("#adv-adf-fire-container").append(trackHtml);
      if (adfTrackToUse['show-track']) {
        adfTracks.attachSection("#adv-adf-fire-container");
      }
    };

    var isLocalAdfInUse = function () {
      if (currentMode === undefined) {
        return false;
      }
      return currentMode['adfTrack'] === 'LocalADF';
    };

    var refreshAdfDisplay = function () {
      if (currentMode === undefined) {
        return;
      }
      var divHtml = "<div id=\"adv-adf-fire-container\">\n</div>\n";
      $("#adv-adf-fire-container").remove();
      $("#adv-adf-modal").append(divHtml);
      addAdfTrackHtml();

      if (currentMode['sam']) {
        advAdfSamMode.attachListener(function () {
          samFired = true;
          refreshAdfDisplay();
        });
        advAdfSamMode.attachSection("#adv-adf-fire-container", isLocalAdfInUse());
      }

      if (samFired && (currentMode['aaa'] || currentMode['ciws'])) {
        var aaaType = "aaa";
        if (currentMode['ciws']) {
          aaaType = "ciws";
        }
        advAdfAaaMode.attachSection("#adv-adf-fire-container", aaaType, isLocalAdfInUse());
      }
    };

    var setMode = function (detType) {
      currentMode = modes[detType];
      advAdfSamMode.reset();
      advAdfAaaMode.reset();
      samFired = !currentMode['sam'];
    };

    var detectionSelected = function (detType) {
      setMode(detType);
      refreshAdfDisplay();
    };

    var getHtml = function () {
      return "<div class=\"adv-adf-modal\" id=\"adv-adf-modal\">\n</div>\n";
    };

    return {
      'init': function () {
        $(".selected-mode").html(getHtml());
        advAdfDetSelector.attachListener(detectionSelected);
        advAdfDetSelector.attachSection();
      }
    };
  })();

  var advAdfSamDRMs = createDrms("adv-adf-sam", [
    {
      'name': 'target-hex-near-hq',
      'type': 'check',
      'value': -1,
      'desc': 'Target/landing hex is w/i 2 hexes from an enemy HQ (-1)',
      'current': 0
    },{
      'name': 'helo-flew-over-enemy',
      'type': 'check',
      'value': -1,
      'desc': 'SAM fire vs. Attack Helicopter which flew over enemy units (not including target hex) (-1)',
      'current': 0
    },{
      'name': 'per-wild-weasel',
      'type': 'drop',
      'max-count': 4,  // Better safe than sorry, can't tell if limit is 2 or 4.
      'value': 2,
      'desc': 'Number Wild Weasel units included in the Strike (+2 each)',
      'current': 0
    },{
      'name': 'vs-stealth-units',
      'type': 'check',
      'value': 3,
      'desc': 'SAM fire vs. Stealth Unit (+3)',
      'current': 0
    },{
      'name': 'weather-is-overcast',
      'type': 'check',
      'value': 1,
      'desc': 'Weather is Overcast (+1)',
      'current': 0
    },{
      'name': 'weather-is-storm',
      'type': 'check',
      'value': 3,
      'desc': 'Weather is Storm (+3)',
      'current': 0
    }
  ], "SAM DRMs");

  var advAdfSamResolver = (function () {
    var useLocalAdf = false;
    var samTable = {
      'local': ['X', 'A', '+2', '+1','+1'],
      1: ['A', '+1', '+1'],
      2: ['A', '+2', '+1', '+1'],
      3: ['X', 'A', '+2', '+1', '+1'],
      4: ['X', 'A', '+2', '+1', '+1'],
      5: ['X', 'A', 'A', '+2', '+1', '+1'],
      6: ['X', 'A', 'A', '+2', '+1', '+1'],
      7: ['X', 'A', 'A', '+2', '+2', '+1', '+1'],
      8: ['X','X', 'A', 'A', '+2', '+2', '+1', '+1'],
      9: ['X','X', 'A', 'A', 'A', '+2', '+2', '+1', '+1'],
      10: ['X','X', 'A', 'A', 'A', 'A', '+2', '+2', '+1', '+1']
    };
    var currentDrm = 0;
    var result;
    var listener;
    var dieRoll;

    var notifyListenerOfResult = function (result) {
      if (listener !== undefined) {
        listener(result);
      }
    };

    var resolveDetection = function () {
      dieRoll = rollDie(currentDrm);
      var detection;

      if (useLocalAdf) {
        detection = 'local';
      } else {
        detection = adfTracks.getCurrentSam();
      }
      var roll = dieRoll['net-roll'];
      if (roll < 0) {
        roll = 0;
      }
      var netResult = samTable[detection][roll];
      if (netResult === undefined) {
        netResult = "\u2014";
      }
      result = netResult;
      //updateResults();
      notifyListenerOfResult(netResult);
    };

    var updateResults = function () {
      if (result === undefined) {
        return;
      }
      var html = "<p class=\"result-label\">Die Roll</p><p class=\"value\">" + dieRoll['raw-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Net Roll</p><p class=\"value\">" + dieRoll['net-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Effect</p><p class=\"value\">" + result + "</p>\n";
      $("#adv-adf-sam-result").html(html);
    };

    var updateDrmDisplay = function () {
      currentDrm = advAdfSamDRMs.sumNetDRM();
      var currentDrmString;
      if (currentDrm < 0) {
        currentDrmString = currentDrm.toString();
      } else {
        currentDrmString = "+" + currentDrm.toString();
      }
      $("#adv-adf-sam-net-drm-value").html(currentDrmString);
    };

    var initTrackEffect = function (localAdfInUse) {
      if (localAdfInUse === true) {
        useLocalAdf = true;
      }
    };

    var addResolutionHandler = function () {
      $("#adv-adf-sam-dice-roll-button").on('click', function () {
        resolveDetection();
      });
    };

    var resetResults = function () {
      result = undefined;
      $("#adv-adf-sam-result").html("&nbsp;");
    };

    var setupDrmListener = function () {
      advAdfSamDRMs.attachListener(function () {
        updateDrmDisplay();
      });
    };

    return {
      'attachSection': function (localAdf, selector) {
        initTrackEffect(localAdf);

        if (!$('.adv-adf-sam-resolution').length) {
          var newHtml = "<div class=\"adv-adf-sam-resolution modals adv-adf-modals\" id=\"adv-adf-sam-resolution\">\n" +
            "<p class=\"heading\">SAM Fire Resolution</p>\n<div id=\"adv-adf-sam-drm-display\" class=\"adv-adf-sam-drm-display\">" +
            "<p class=\"result-label\">Current Net DRM:</p><p class=\"value\" id=\"adv-adf-sam-net-drm-value\">+0</p>" +
            "</div><input type=\"button\" class=\"dice-roll-button\" " +
            "id=\"adv-adf-sam-dice-roll-button\" value=\"Roll Die\">\n<div class=\"adv-adf-sam-result\" " +
            "id=\"adv-adf-sam-result\">&nbsp;</div></div>\n";
          $(selector).append(newHtml);
          addResolutionHandler();
          setupDrmListener();
        }
        updateDrmDisplay();
        updateResults();
      },
      'reset': function () {
        resetResults();
      },
      'attachListener': function (l) {
        listener = l;
      },
      'removeResolver': function () {
        $("#adv-adf-sam-resolution").remove();
      }
    };
  })();

  var advAdfSamMode = (function () {
    var localAdfInUse = false;
    var listener;

    var getHtml = function () {
      return "<div id=\"adv-adf-sam-container\">\n<p class=\"major-heading extra-padding\">SAM Fire</p>\n</div>\n";
    };

    var resetContainer = function () {
      var container = $("#adv-adf-sam-container");
      if (container.length) {
        container.remove();
      }
    };

    var samFiredEventHandler = function () {
      if (listener !== undefined) {
        listener();
      }
    };

    return {
      'attachSection': function (selector, useLocalAdf) {
        localAdfInUse = useLocalAdf === true;
        resetContainer();
        $(selector).append(getHtml());
        advAdfSamDRMs.attachSection("#adv-adf-sam-container");
        advAdfSamResolver.attachListener(samFiredEventHandler);
        advAdfSamResolver.attachSection(localAdfInUse, "#adv-adf-sam-container");
      },
      'attachListener': function (l) {
        listener = l;
      },
      'reset': function () {
        advAdfSamDRMs.resetDRMs();
        advAdfSamResolver.reset();
        resetContainer();
      }
    };
  })();

  var advAdfAaaDRMs = createDrms("adv-adf-aaa", [
    {
      'name': 'target-helo',
      'type': 'check',
      'value': -1,
      'desc': 'AAA Target is an Attack Helicopter (-1)',
      'current': 0
    },{
      'name': 'target-air-transport',
      'type': 'check',
      'value': -1,
      'desc': 'AAA target is a Transport Mission (Airmobile, Air Transport, Paradrop) (-1)',
      'current': 0
    },{
      'name': 'vs-stealth-units',
      'type': 'check',
      'value': 3,
      'desc': 'SAM fire vs. Stealth Unit (+3)',
      'current': 0
    },{
      'name': 'weather-is-overcast',
      'type': 'check',
      'value': 2,
      'desc': 'Weather is Overcast (+2)',
      'current': 0
    },{
      'name': 'weather-is-storm',
      'type': 'check',
      'value': 4,
      'desc': 'Weather is Storm (+4)',
      'current': 0
    }
  ], "AAA DRMs");

  var advAdfCiwsDRMs = createDrms("adv-adf-ciws", [
    {
      'name': 'target-helo',
      'type': 'check',
      'value': -1,
      'desc': 'AAA Target is an Attack Helicopter (-1)',
      'current': 0
    },{
      'name': 'target-air-transport',
      'type': 'check',
      'value': -1,
      'desc': 'AAA target is a Transport Mission (Airmobile, Air Transport, Paradrop) (-1)',
      'current': 0
    },{
      'name': 'us-ciws-cruise',
      'type': 'check',
      'value': -1,
      'desc': "US Naval CIWS bonus vs. Cruise Missile (-1)",
      'current': 0
    },{
      'name': 'vs-stealth-units',
      'type': 'check',
      'value': 3,
      'desc': 'SAM fire vs. Stealth Unit (+3)',
      'current': 0
    },{
      'name': 'weather-is-overcast',
      'type': 'check',
      'value': 2,
      'desc': 'Weather is Overcast (+2)',
      'current': 0
    },{
      'name': 'weather-is-storm',
      'type': 'check',
      'value': 4,
      'desc': 'Weather is Storm (+4)',
      'current': 0
    }
  ], "CIWS DRMs <span class=\"adf-mode-caveat\">(automatic -1 DRM for Naval AAA/CIWS)</span>", -1);

  var advAdfAaaResolver = (function () {
    var useLocalAdf = false;
    var aaaType = "sam";
    var aaaTable = {
      'local': ['+2', '+1','+1'],
      1: ['+2', '+1', '+1'],
      2: ['A', '+2', '+2', '+1', '+1'],
      3: ['X', 'A', 'A', '+2', '+2', '+1', '+1']
    };
    var currentDrm = 0;
    var result;
    var dieRoll;
    var typeLabels = {
      'aaa': 'AAA',
      'ciws': 'CIWS'
    };

    var resolveAaaFire = function () {
      dieRoll = rollDie(currentDrm);
      var detection;

      if (useLocalAdf) {
        detection = 'local';
      } else {
        detection = adfTracks.getCurrentAAA();
      }
      var roll = dieRoll['net-roll'];
      if (roll < 0) {
        roll = 0;
      }
      var netResult = aaaTable[detection][roll];
      if (netResult === undefined) {
        netResult = "\u2014";
      }
      result = netResult;
      updateResults();
    };

    var updateResults = function () {
      if (result === undefined) {
        return;
      }
      var html = "<p class=\"result-label\">Die Roll</p><p class=\"value\">" + dieRoll['raw-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Net Roll</p><p class=\"value\">" + dieRoll['net-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Effect</p><p class=\"value\">" + result + "</p>\n";
      $("#adv-adf-aaa-result").html(html);
    };

    var getDrms = function () {
      if (aaaType === 'ciws') {
        return advAdfCiwsDRMs.sumNetDRM();
      } else {
        return advAdfAaaDRMs.sumNetDRM();
      }
    };

    var updateDrmDisplay = function () {
      currentDrm = getDrms();
      var currentDrmString;
      if (currentDrm < 0) {
        currentDrmString = currentDrm.toString();
      } else {
        currentDrmString = "+" + currentDrm.toString();
      }
      $("#adv-adf-aaa-net-drm-value").html(currentDrmString);
    };

    var initTrackEffect = function (localAdfInUse) {
      if (localAdfInUse === true) {
        useLocalAdf = true;
      }
    };

    var addResolutionHandler = function () {
      $("#adv-adf-aaa-dice-roll-button").on('click', function () {
        resolveAaaFire();
      });
    };

    var resetResults = function () {
      result = undefined;
      $("#adv-adf-aaa-result").html("&nbsp;");
    };

    var setupDrmListener = function () {
      advAdfSamDRMs.attachListener(function () {
        updateDrmDisplay();
      });
    };

    return {
      'attachSection': function (localAdf, aaaTypeToUse, selector) {
        aaaType = aaaTypeToUse;
        initTrackEffect(localAdf);

        if (!$('.adv-adf-aaa-resolution').length) {
          var newHtml = "<div class=\"adv-adf-aaa-resolution modals adv-adf-modals\" id=\"adv-adf-aaa-resolution\">\n" +
            "<p class=\"heading\">" + typeLabels[aaaType] + " Fire Resolution</p>\n<div id=\"adv-adf-aaa-drm-display\" " +
            "class=\"adv-adf-aaa-drm-display\">" +
            "<p class=\"result-label\">Current Net DRM:</p><p class=\"value\" id=\"adv-adf-aaa-net-drm-value\">+0</p>" +
            "</div><input type=\"button\" class=\"dice-roll-button\" " +
            "id=\"adv-adf-aaa-dice-roll-button\" value=\"Roll Die\">\n<div class=\"adv-adf-aaa-result\" " +
            "id=\"adv-adf-aaa-result\">&nbsp;</div></div>\n";
          $(selector).append(newHtml);
          addResolutionHandler();
          setupDrmListener();
        }
        updateDrmDisplay();
        updateResults();
      },
      'reset': function () {
        resetResults();
      },
      'removeResolver': function () {
        $("#adv-adf-aaa-resolution").remove();
      }
    };
  })();

  var advAdfAaaMode = (function () {
    var typeLabels = {
      'aaa': "AAA",
      'ciws': "CIWS"
    };
    var localAdfInUse = false;
    var aaaType;

    var getHtml = function () {
      return "<div id=\"adv-adf-aaa-container\">\n<p class=\"major-heading\">" + typeLabels[aaaType] + " Fire</p>\n</div>\n";
    };

    var resetContainer = function () {
      var container = $("#adv-adf-aaa-container");
      if (container.length) {
        container.remove();
      }
    };

    return {
      'attachSection': function (selector, type, useLocalAdf) {
        aaaType = type;
        localAdfInUse = useLocalAdf === true;
        resetContainer();
        $(selector).append(getHtml());
        if (aaaType === 'aaa') {
          advAdfAaaDRMs.attachSection("#adv-adf-aaa-container");
        } else {
          advAdfCiwsDRMs.attachSection("#adv-adf-aaa-container");
        }
        advAdfAaaResolver.attachSection(localAdfInUse, aaaType, "#adv-adf-aaa-container");
      },
      'reset': function () {
        advAdfAaaDRMs.resetDRMs();
        advAdfCiwsDRMs.resetDRMs();
        advAdfAaaResolver.reset();
        resetContainer();
      }
    };
  })();

  var advAdfDetSelector = (function () {
    var selectors = [
      {
        'name': 'adv-adf-selector-normal',
        'label': 'Standard ADF',
        'caveat': undefined,
        'det-types': [
          {
            'type': 'early',
            'label': 'Early Detection (ED)'
          },{
            'type': 'normal',
            'label': 'Detected (D)'
          },{
            'type': 'none',
            'label': "Undetected (\u2014)"
          }
        ]
      },{
        'name': 'adv-adf-selector-naval',
        'label': 'Naval ADF',
        'caveat': '(not in At-Sea Hex unless using Naval Umbrella)',
        'det-types': [
          {
            'type': 'early',
            'label': 'Early Detection (ED or D)'
          },{
            'type': 'none',
            'label': "Undetected (\u2014)"
          }
        ]

      }, {
        'name': 'adv-adf-selector-local',
        'label': 'Local ADF',
        'caveat': undefined,
        'det-types': [
          {
            'type': 'normal',
            'label': 'Detected (D)'
          },{
            'type': 'none',
            'label': "Undetected (\u2014)"
          }
        ]
      }
    ];
    var selectedDetType;
    var listener;

    var getDetTypeHtml = function (parent, type) {
      return "<li class=\"det-type\" id=\"" + parent['name'] + '-' + type['type'] + "\">" +
        type['label'] + "</li>\n";
    };

    var getSelectorHtml = function (selector) {
      var html = "<div class=\"adv-adf-selector\" id=\"" + selector['name'] + "\">\n<p class=\"det-label\">" +
        selector['label'];
      if (selector['caveat'] !== undefined) {
        html += "<br><span class=\"adf-mode-caveat\">" + selector['caveat'] + "</span>";
      }
      html += "</p>\n<ul class=\"det-types\" id=\"" + selector['name'] + '-det-types' + "\">\n";
      var numTypes = selector['det-types'].length;
      for (var i = 0; i < numTypes; i++) {
        html += getDetTypeHtml(selector, selector['det-types'][i]);
      }
      html += "</ul>\n</div>\n";
      return html;
    };

    var getHtml = function () {
      var html = "<div class=\"adv-adf-selectors\" id=\"adv-adf-selectors\">\n" +
        "<p class=\"heading\">Select Detection Type</p>\n";
      var numSelectors = selectors.length;
      for (var i = 0; i < numSelectors; i++) {
        html += getSelectorHtml(selectors[i]);
      }
      html += "</div>\n";
      return html;
    };

    var resetSelection = function () {
      selectedDetType = undefined;
    };

    var signalListener = function () {
      if (listener !== undefined) {
        listener(selectedDetType);
      }
    };
    
    var refreshSelection = function () {
      $(".det-type").each(function (index, element) {
        var elementId = $(element).prop("id");
        if (elementId === selectedDetType) {
          $(element).addClass("selected");
        } else {
          if ($(element).hasClass("selected")) {
            $(element).removeClass("selected");
          }
        }
      });
    };

    var handleSelection = function () {
      selectedDetType = $(this).prop("id");
      refreshSelection();
      signalListener();
    };

    var registerHandlers = function () {
      $(".det-type").on('click', handleSelection);
    };

    return {
      'attachSection': function () {
        if (!$("#adv-adf-selectors").length) {
          resetSelection();
          $("#adv-adf-modal").prepend(getHtml());
          registerHandlers();
        }
        refreshSelection();
      },
      'detachSection': function () {
        $("adv-adf-selectors").remove();
        selectedDetType = undefined;
      },
      'attachListener': function (l) {
        listener = l;
      }
    };
  })();

  var createModeSelector = function (title, prefix, modes) {
    var listener;
    var selection;
    
    var signalListener = function () {
      listener();
    };
    
    var refreshSelection = function () {
      var selectedId = prefix + '-' + selection;
      $("." + prefix + "-element").each(function (index, element) {
        var elementId = $(element).prop('id');
        if (elementId === selectedId) {
          $(element).addClass("selected");
        } else {
          if ($(element).hasClass("selected")) {
            $(element).removeClass("selected");
          }
        }
      });
    };
    
    var resetSelection = function () {
      selection = undefined;
      refreshSelection();
    };
    
    var selectionHandler = function () {
      var elementId = $(this).prop('id');
      var nameParts = elementId.split('-');
      selection = nameParts[nameParts.length - 1];
      refreshSelection();
      signalListener();
    };
    
    var registerHandlers = function () {
      $("." + prefix + "-element").each(function (index, element) {
        $(element).on('click', selectionHandler);
      });
    };
    
    var getElementHtml = function (element) {
      return "<li class=\"" + prefix + "-element\" id=\"" + prefix + "-" + element['name'] + "\">" +
          element['label'] + "</li>\n";
    };
    
    var getElementsHtml = function () {
      var html = "<ul class=\"" + prefix + "-elements\" id=\"" + prefix + "-elements\">\n";
      var numElements = modes.length;
      for (var i = 0; i < numElements; i++) {
        html += getElementHtml(modes[i]);
      }
      html += "</ul>\n";
      return html;
    };
    
    var getHtml = function () {
      var html = "<div class=\"" + prefix + "-selectors\" id=\"" + prefix + "-selectors\">\n" +
        "<p class=\"heading\">" + title + "</p>\n";
      html += getElementsHtml();
      html += "</div>\n";
      return html;
    };

    return {
      'attachSection': function (selector) {
        if (!$("#" + prefix + "-selectors").length) {
          resetSelection();
          $(selector).append(getHtml());
          registerHandlers();
        }
        refreshSelection();
      },
      'remove': function () {
        selection = undefined;
        $("#" + prefix + "-selectors").remove();
      },
      'reset': function () {
        selection = undefined;
      },
      'getSelection': function () {
        return selection;
      },
      'attachListener': function (l) {
        listener = l;
      }      
    };
  };

  var interdictionTerrainSelector = createModeSelector("Terrain", "int-terrain-selector", [
    {
      'label': 'Marsh/Flat',
      'name': 'flat'
    },{
      'label': 'Rough/Flat Woods/Rough Woods',
      'name': 'rough'
    },{
      'label': 'Highland/Highland Woods',
      'name': 'highland'
    },{
      'label': 'Mountain/High Mountain',
      'name': 'mountain'
    }
  ]);

  var interdictionValueSelector = createModeSelector("Interdiction Value", "int-value-selector", [
    {
      'label': '1',
      'name': '1'
    },{
      'label': '2',
      'name': '2'
    },{
      'label': '3',
      'name': '3'
    },{
      'label': '4',
      'name': '4'
    },{
      'label': '5',
      'name': '5'
    },{
      'label': '6',
      'name': '6'
    }
  ]);

  var advIntDRMs = createDrms("adv-int-drms", [
    {
      'name': 'pilot-skills',
      'type': 'drop',
      'value': 1,
      'min-count': -2,
      'max-count': 1,
      'desc': 'Pilot skill',
      'current': 0
    },{
      'name': 'high-mountain',
      'type': 'check',
      'value': -2,
      'desc': 'High Mountain (-2)',
      'current': 0
    },{
      'name': 'attack-helo',
      'type': 'check',
      'value': -1,
      'desc': 'Attack Helicopter (-1)',
      'current': 0
    },{
      'name': 'sam-result',
      'type': 'drop',
      'max-count': 2,
      'value': 1,
      'desc': 'SAM Result (+?)',
      'current': 0
    },{
      'name': 'unit-intercepted',
      'type': 'check',
      'value': 2,
      'desc': 'Unit was attacked by interceptors(+2)',
      'current': 0
    },{
      'name': 'stand-off-weapons',
      'type': 'check',
      'value': 3,
      'desc': "Stand-off weapons used (+3)",
      'current': 0
    }
  ], "Advanced Interdiction DRMs");

  var advInterdictionMode = (function () {
    var terrainSelected = false;
    var interdictionValueSelected = false;

    var interdictionValueSelectedHandler = function () {
      interdictionValueSelected = true;
      drawRequiredSections();
    };

    var terrainSelectedHandler = function () {
      terrainSelected = true;
      drawRequiredSections();
    };

    var drawRequiredSections = function () {
      if (!$(".adv-int-modal").length) {
        $(".selected-mode").html("<div class=\"adv-int-modal\" id=\"adv-int-modal\">\n</div>\n");
      }

      if (!terrainSelected) {
        interdictionTerrainSelector.attachSection("#adv-int-modal");
        interdictionTerrainSelector.attachListener(terrainSelectedHandler);
      }
      if (!interdictionValueSelected) {
        interdictionValueSelector.attachSection("#adv-int-modal");
        interdictionValueSelector.attachListener(interdictionValueSelectedHandler);
      }
      if (terrainSelected && interdictionValueSelected) {
        advIntDRMs.attachSection("#adv-int-modal");
        advIntResolver.attachSection("#adv-int-modal");
      }
    };

    return {
      'init': function () {
        terrainSelected = false;
        interdictionValueSelected = false;
        drawRequiredSections();
      }
    };
  })();

  var advIntResolver = (function () {
    var intTableRaw = [
      [1,1,1],
      [1,1,1,1,1],
      [2,1,1,1,1,1],
      [2,2,1,1,1,1,1],
      [2,2,2,1,1,1,1,1],
      [2,2,2,2,1,1,1,1,1],
      [2,2,2,2,2,1,1,1,1]
    ];
    var columnTable = {
      'flat': [0,0,1,1,2,2],
      'rough': [1,1,2,2,3,3],
      'highland': [2,3,3,4,4,5],
      'mountain': [3,4,4,5,5,6]
    };
    var currentDrm = 0;
    var result;
    var dieRoll;

    var tableColumnSelector = function (terrain, interdictValue) {
      return columnTable[terrain][interdictValue - 1];
    };

    var lookupInterdictionValue = function (terrain, interdictValue, netRoll) {
      var column = intTableRaw[tableColumnSelector(terrain, interdictValue)];
      if (netRoll < -2) {
        netRoll = -2;
      }
      var rawValue = column[netRoll + 2];
      if (rawValue === undefined) {
        return "\u2014";
      } else {
        return rawValue;
      }
    };

    var resolveInterdiction = function () {
      dieRoll = rollDie(currentDrm);

      var roll = dieRoll['net-roll'];

      var terrain = interdictionTerrainSelector.getSelection();
      var interdictValue = parseInt(interdictionValueSelector.getSelection());

      var netResult = lookupInterdictionValue(terrain, interdictValue, roll);
      if (netResult === undefined) {
        netResult = "\u2014";
      }
      result = netResult;
      updateResults();
    };

    var updateResults = function () {
      if (result === undefined) {
        return;
      }
      var html = "<p class=\"result-label\">Die Roll</p><p class=\"value\">" + dieRoll['raw-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Net Roll</p><p class=\"value\">" + dieRoll['net-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Effect</p><p class=\"value\">" + result + "</p>\n";
      $("#adv-int-result").html(html);
    };

    var getDrms = function () {
      return advIntDRMs.sumNetDRM();
    };

    var updateDrmDisplay = function () {
      currentDrm = getDrms();
      var currentDrmString;
      if (currentDrm < 0) {
        currentDrmString = currentDrm.toString();
      } else {
        currentDrmString = "+" + currentDrm.toString();
      }
      $("#adv-int-net-drm-value").html(currentDrmString);
    };

    var addResolutionHandler = function () {
      $("#adv-int-dice-roll-button").on('click', function () {
        resolveInterdiction();
      });
    };

    var resetResults = function () {
      result = undefined;
      $("#adv-int-result").html("&nbsp;");
    };

    var setupDrmListener = function () {
      advIntDRMs.attachListener(function () {
        updateDrmDisplay();
      });
    };

    return {
      'attachSection': function (selector) {
        if (!$('.adv-int-resolution').length) {
          var newHtml = "<div class=\"adv-int-resolution modals adv-adf-modals\" id=\"adv-int-resolution\">\n" +
            "<p class=\"heading\">Interdiction Resolution</p>\n<div id=\"adv-int-drm-display\" " +
            "class=\"adv-int-drm-display\">" +
            "<p class=\"result-label\">Current Net DRM:</p><p class=\"value\" id=\"adv-int-net-drm-value\">+0</p>" +
            "</div><input type=\"button\" class=\"dice-roll-button\" " +
            "id=\"adv-int-dice-roll-button\" value=\"Roll Die\">\n<div class=\"adv-int-result\" " +
            "id=\"adv-int-result\">&nbsp;</div></div>\n";
          $(selector).append(newHtml);
          addResolutionHandler();
          setupDrmListener();
        }
        updateDrmDisplay();
        updateResults();
      },
      'reset': function () {
        resetResults();
      },
      'removeResolver': function () {
        $("#adv-int-resolution").remove();
      }
    };
  })();

  var strikeTerrainSelector = createModeSelector("Terrain", "strike-terrain-selector", [
    {
      'label': 'Marsh/Flat',
      'name': 'flat'
    },{
      'label': 'Rough/Flat Woods/Rough Woods',
      'name': 'rough'
    },{
      'label': 'Highland/Highland Woods',
      'name': 'highland'
    },{
      'label': 'Mountain',
      'name': 'mountain'
    },{
      'label': 'Urban',
      'name': 'urban'
    },{
      'label': 'Air Defense Tracks',
      'name': 'adf'
    },{
      'label': 'Hardened Target/Naval Unit',
      'name': 'hardened'
    }
  ]);

  var strikeTypeSelector = createModeSelector("Strike Type", "strike-type-selector",[
    {
      'label': 'Air strike',
      'name': 'air'
    },{
      'label': 'Wild Weasel',
      'name': 'weasel'
    },{
      'label': 'Helicopter',
      'name': 'helo'
    },{
      'label': 'Naval strike',
      'name': 'naval'
    },{
      'label': 'Supreme HQ',
      'name': 'suphq'
    },{
      'label': 'US HQ',
      'name': 'ushq'
    },{
      'label': 'Other HQ',
      'name': 'otherhq'
    },{
      'label': 'Scud',
      'name': 'scud'
    },{
      'label': 'Ballistic Missile',
      'name': 'missile'
    },{
      'label': 'Cruise Missile',
      'name': 'cruise'
    }
  ]);

  var airStrikeValueSelector = createModeSelector("Air Strike Value", "strike-value-selector", [
    {
      'label': '1',
      'name': '1'
    },{
      'label': '2',
      'name': '2'
    },{
      'label': '3',
      'name': '3'
    },{
      'label': '4',
      'name': '4'
    },{
      'label': '5',
      'name': '5'
    },{
      'label': '6',
      'name': '6'
    }
  ]);

  var heloStrikeValueSelector = createModeSelector("Attack Helicopter Strike Value", "strike-value-selector", [
    {
      'label': '1',
      'name': '1'
    },{
      'label': '2',
      'name': '2'
    }
  ]);

  var navalStrikeValueSelector = createModeSelector("Naval Strike Value", "strike-value-selector", [
    {
      'label': '1',
      'name': '1'
    },{
      'label': '2',
      'name': '2'
    },{
      'label': '3',
      'name': '3'
    }
  ]);

  var advStrikeDRMs = createDrms("adv-strike-drms", [
    {
      'desc': 'Target hex is overstacked (-2)',
      'name': 'target-overstack',
      'type': 'check',
      'value': -2,
      'current': 0
    },{
      'desc': 'High Mountain (-2)',
      'name': 'high-mountain',
      'type': 'check',
      'value': -2,
      'current': 0
    },{
      'desc': 'Target is a "Targeted -1/-2" Unit/Installation (-1 or -2)',
      'name': 'has-targetted',
      'type': 'drop',
      'value': 1,
      'min-count': -2,
      'max-count': 0,
      'current': 0
    },{
      'desc': 'Pilot skill',
      'name': 'pilot-skills',
      'type': 'drop',
      'value': 1,
      'min-count': -2,
      'max-count': 1,
      'current': 0
    },{
      'desc': 'SAM Result (+?)',
      'name': 'sam-result',
      'type': 'drop',
      'max-count': 2,
      'value': 1,
      'current': 0
    },{
      'desc': 'AH-1Z Wild Weasel Strike [Optional] (+1)',
      'name': 'ah-1z-wild-weasel',
      'type': 'check',
      'value': 1,
      'current': 0
    },{
      'desc': 'Non-US Cruise Missile Strike (+1)',
      'name': 'non-us-cruise',
      'type': 'check',
      'value': 1,
      'current': 0
    },{
      'desc': 'Striking HQ is reduced-strength (+1)',
      'name': 'reduced-hq',
      'type': 'check',
      'value': 1,
      'current': 0
    },{
      'desc': 'Target is a Bridge (+2)',
      'name': 'vs-bridge',
      'type': 'check',
      'value': 2,
      'current': 0
    },{
      'desc': 'Unit was attacked by interceptors (+2)',
      'name': 'unit-intercepted',
      'type': 'check',
      'value': 2,
      'current': 0
    },{
      'desc': 'Theater Weapon Busting Strike Mission (+2)',
      'name': 'theater-weapon-busting',
      'type': 'check',
      'value': 2,
      'current': 0
    },{
      'desc': 'For all AIR strikes in Overcast weather (+2)',
      'name': 'overcast-weather',
      'type': 'check',
      'value': 2,
      'current': 0
    },{
      'desc': "Target is an Enemy AAA Track (+3)",
      'name': 'target-enemy-aaa',
      'type': 'check',
      'value': 3,
      'current': 0
    },{
      'desc': "Air or HQ Strike in Storm turn (+3)",
      'name': 'storm-weather',
      'type': 'check',
      'value': 3,
      'current': 0
    },{
      'desc': "Stand-off Air vs. Leg Unit (+3)",
      'name': 'stand-off-air-vs-leg',
      'type': 'check',
      'value': 3,
      'current': 0
    }
  ], "Advanced Strike DRMs");

  var advStrikeVsNavalDRMs = createDrms("adv-strike-naval-drms", [
    {
      'desc': 'Naval Air Unit conducting strike (-1)',
      'name': 'naval-air-striking',
      'type': 'check',
      'value': -1,
      'current': 0
    },{
      'desc': 'Point Detection (-1)',
      'name': 'point-detection',
      'type': 'check',
      'value': -1,
      'current': 0
    },{
      'desc': 'Air unit in non-Stand-off Strike (-1)',
      'name': 'not-stand-off',
      'type': 'check',
      'value': -1,
      'current': 0
    },{
      'desc': 'Theater Weapon (+1)',
      'name': 'theater-weapon',
      'type': 'check',
      'value': 1,
      'current': 0
    }
  ], "Strike Vs. Naval DRMs (cumulative with above)");

  var advStrikeResolver = (function () {
    var intTableRaw = [
      [1,1,1],
      [1,1,1,1,1],
      [2,1,1,1,1,1],
      [2,2,1,1,1,1,1],
      ['X', 'X', 2, 2, 1, 1, 1, 1],
      ['X', 'X', 'X', 2, 2, 1, 1, 1],
      ['X', 'X', 'X', 'X', 2, 2, 1, 1],
      ['X', 'X', 'X', 'X', 'X', 2, 2, 1],
      ['X', 'X', 'X', 'X', 2, 2, 1, 1, 1]
    ];
    var columnTable = {
      'flat': {'1': 2, '2': 3, '3': 4, '4': 5, '5': 6, '6': 7, 'suphq': 3, 'otherhq': 4, 'ushq': 5,
        'helo-1': 3, 'helo-2': 5, 'scud': 7, 'missile': 7, 'cruise': 8},
      'rough': {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, 'suphq': 2, 'otherhq': 3, 'ushq': 4,
        'helo-1': 2, 'helo-2': 4, 'scud': 7, 'missile': 7, 'cruise': 8},
      'highland': {'1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, 'suphq': 1, 'otherhq': 2, 'ushq': 3,
        'helo-1': 1, 'helo-2': 3, 'scud': 7, 'missile': 7, 'cruise': 8},
      'mountain': {'2': 0, '3': 1, '4': 2, '5': 3, '6': 5, 'suphq': 0, 'otherhq': 1, 'ushq': 2,
        'helo-1': 0, 'helo-2': 2, 'scud': 7, 'missile': 7, 'cruise': 8},
      'urban': {'2': 0, '3': 1, '4': 2, '5': 3, '6': 5, 'suphq': 0, 'otherhq': 1, 'ushq': 2,
        'helo-1': 0, 'helo-2': 2, 'scud': 7, 'missile': 7, 'cruise': 8},
      'adf': {'2': 0, '3': 1, '4': 2, '5': 3, '6': 4, 'scud': 0, 'cruise': 3, 'weasel': 5},
      'hardened': {'2': 0, '3': 1, '4': 2, '5': 3, '6': 4, 'scud': 2, 'cruise': 3, 'naval-1': 2, 'naval-2': 3,
        'naval-3': 4}
    };
    var currentDrm = 0;
    var result;
    var dieRoll;

    var tableColumnSelector = function (terrain, strikeCode) {
      return columnTable[terrain][strikeCode];
    };

    var lookupStrikeValue = function (terrain, strikeCode, netRoll) {
      var column = intTableRaw[tableColumnSelector(terrain, strikeCode)];
      if (column === undefined) {
        return "\u2014";
      }
      if (netRoll < -2) {
        netRoll = -2;
      }
      var rawValue = column[netRoll + 2];
      if (rawValue === undefined) {
        return "\u2014";
      } else {
        return rawValue;
      }
    };

    var resolveStrike = function () {
      dieRoll = rollDie(currentDrm);

      var roll = dieRoll['net-roll'];

      var terrain = strikeTerrainSelector.getSelection();
      var strikeType = strikeTypeSelector.getSelection();
      var strikeCode = strikeType;
      if (strikeType === "air") {
        strikeCode = airStrikeValueSelector.getSelection();
      } else if (strikeType === "helo") {
        strikeCode = strikeType + "-" + heloStrikeValueSelector.getSelection();
      } else if (strikeType === "naval") {
        strikeCode = strikeType + "-" + navalStrikeValueSelector.getSelection();
      }

      var netResult = lookupStrikeValue(terrain, strikeCode, roll);
      if (netResult === undefined) {
        netResult = "\u2014";
      }
      result = netResult;
      updateResults();
    };

    var updateResults = function () {
      if (result === undefined) {
        return;
      }
      var html = "<p class=\"result-label\">Die Roll</p><p class=\"value\">" + dieRoll['raw-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Net Roll</p><p class=\"value\">" + dieRoll['net-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Effect</p><p class=\"value\">" + result + "</p>\n";
      $("#adv-strike-result").html(html);
    };

    var getDrms = function () {
      return advStrikeDRMs.sumNetDRM() + advStrikeVsNavalDRMs.sumNetDRM();
    };

    var updateDrmDisplay = function () {
      currentDrm = getDrms();
      var currentDrmString;
      if (currentDrm < 0) {
        currentDrmString = currentDrm.toString();
      } else {
        currentDrmString = "+" + currentDrm.toString();
      }
      $("#adv-strike-net-drm-value").html(currentDrmString);
    };

    var addResolutionHandler = function () {
      $("#adv-strike-dice-roll-button").on('click', function () {
        resolveStrike();
      });
    };

    var resetResults = function () {
      result = undefined;
      $("#adv-strike-result").html("&nbsp;");
    };

    var setupDrmListener = function () {
      advStrikeDRMs.attachListener(function () {
        updateDrmDisplay();
      });
      advStrikeVsNavalDRMs.attachListener(function () {
        updateDrmDisplay();
      });
    };

    return {
      'attachSection': function (selector) {
        if (!$('#adv-strike-resolution').length) {
          var newHtml = "<div class=\"adv-strike-resolution modals adv-strike-modals\" id=\"adv-strike-resolution\">\n" +
            "<p class=\"heading\">Strike Resolution</p>\n<div id=\"adv-strike-drm-display\" " +
            "class=\"adv-strike-drm-display\">" +
            "<p class=\"result-label\">Current Net DRM:</p><p class=\"value\" id=\"adv-strike-net-drm-value\">+0</p>" +
            "</div><input type=\"button\" class=\"dice-roll-button\" " +
            "id=\"adv-strike-dice-roll-button\" value=\"Roll Die\">\n<div class=\"adv-strike-result\" " +
            "id=\"adv-strike-result\">&nbsp;</div></div>\n";
          $(selector).append(newHtml);
          addResolutionHandler();
          setupDrmListener();
        }
        updateDrmDisplay();
        updateResults();
      },
      'reset': function () {
        resetResults();
      },
      'removeResolver': function () {
        $("#adv-strike-resolution").remove();
      }
    };
  })();

  var advStrikeMode = (function () {
    var terrainSelected = false;
    var strikeTypeSelected = false;
    var strikeValueSelected = false;
    var strikeValueTable = {
      'air': airStrikeValueSelector,
      'ww': undefined,
      'helo': heloStrikeValueSelector,
      'naval': navalStrikeValueSelector,
      'suphq': undefined,
      'ushq': undefined,
      'otherhq': undefined,
      'scud': undefined,
      'cruise': undefined,
      'missile': undefined
    };

    var strikeTypeSelectedHandler = function () {
      strikeTypeSelected = true;
      strikeValueSelected = false;
      resetResults();
      drawRequiredSections();
    };

    var terrainSelectedHandler = function () {
      terrainSelected = true;
      strikeValueSelected = false;
      resetResults();
      drawRequiredSections();
    };

    var strikeValueSelectedHandler = function () {
      strikeValueSelected = true;
      resetResults();
      drawRequiredSections();
    };

    var clearStrikeValueSelectors = function () {
      $.each(strikeValueTable, function (index, value) {
        if (value !== undefined) {
          value.remove();
        }
      });
    };

    var resetResults = function () {
      advStrikeDRMs.resetDRMs();
      advStrikeVsNavalDRMs.resetDRMs();
      advStrikeResolver.reset();
    };

    var drawRequiredSections = function () {
      if (!$(".adv-strike-modal").length) {
        $(".selected-mode").html("<div class=\"adv-strike-modal\" id=\"adv-strike-modal\">\n</div>\n");
      }

      if (!terrainSelected) {
        strikeTerrainSelector.attachSection("#adv-strike-modal");
        strikeTerrainSelector.attachListener(terrainSelectedHandler);
      }
      if (!strikeTypeSelected) {
        strikeTypeSelector.attachSection("#adv-strike-modal");
        strikeTypeSelector.attachListener(strikeTypeSelectedHandler);
      }
      if (terrainSelected && strikeTypeSelected && !strikeValueSelected) {
        clearStrikeValueSelectors();
        var strikeType = strikeTypeSelector.getSelection();
        var strikeValueSelector = strikeValueTable[strikeType];
        if (strikeValueSelector === undefined) {
          strikeValueSelected = true;
        } else {
          strikeValueSelector.attachListener(strikeValueSelectedHandler);
          strikeValueSelector.attachSection("#adv-strike-modal");
        }
      }
      if (terrainSelected && strikeTypeSelected && strikeValueSelected) {
        advStrikeDRMs.attachSection("#adv-strike-modal");
        advStrikeVsNavalDRMs.attachSection("#adv-strike-modal");
        advStrikeResolver.attachSection("#adv-strike-modal");
      } else {
        advStrikeDRMs.removeDRMs();
        advStrikeVsNavalDRMs.removeDRMs();
        advStrikeResolver.removeResolver();
      }
    };

    return {
      'init': function () {
        terrainSelected = false;
        strikeTypeSelected = false;
        strikeValueSelected = false;
        drawRequiredSections();
      }
    };
  })();

  var airCombatDifferentialSelector = (function () {
    var differential = 0;
    var listener;

    var refreshDisplay = function () {
      $(".adv-air-combat-diff-box").each(function (index, element) {
        var selector = $(element);
        var splitId = selector.prop('id').split('_');
        if (parseInt(splitId[1]) === differential) {
          selector.css('background-color', 'deepskyblue');
        } else {
          selector.css('background-color', 'transparent');
        }
      });
    };

    var clickHandler = function () {
      var splitId = $(this).prop('id').split('_');
      differential = parseInt(splitId[1]);
      refreshDisplay();
      if (listener !== undefined) {
        listener();
      }
    };

    var setupClickHandlers = function () {
      $(".adv-air-combat-diff-box").on('click', clickHandler);
    };

    var formatNumber = function (num) {
      var formatted = num.toString();
      if (num >= 0) {
        formatted = "+" + formatted;
      }
      return formatted;
    };

    var getHtml = function () {
      var html = "<div class=\"adv-air-combat-diff-modal\" id=\"adv-air-combat-diff-modal\">\n" +
        "<p class=\"heading\">Air Combat Differential (Attacker - Target)</p>\n" +
        "<ul class=\"differential-holder\">";
      for (var i = 4; i > -5; i--) {
        html += "<li class=\"adv-air-combat-diff-box\" id=\"adv-air-combat-diff-box_" + i +"\">" +
          formatNumber(i) + "</li>\n";
      }
      html += "</ul>\n</div>\n";
      return html;
    };

    return {
      'attachSection': function (selector) {
        if (!$("#adv-air-combat-diff-modal").length) {
          $(selector).append(getHtml());
          setupClickHandlers();
        }
        refreshDisplay();
      },
      'attachListsner': function (l) {
        listener = l;
      },
      'getDifferential': function () {
        return differential;
      },
      'reset': function () {
        differential = 0;
        refreshDisplay();
      }
    };
  })();

  var airCombatCommonDrms = createDrms('air-combat-common', [
    {
      'desc': 'Storm (+3)',
      'name': 'storm',
      'value': 3,
      'type': 'check',
      'current': 0
    }
  ], 'Air Combat Common DRMs');

  var airCombatStandDogDrms = createDrms('air-combat-stand-dog', [
    {
      'desc': 'Attack vs. (#) or 0 Air to Air Strength (-1)',
      'name': 'candy-from-babies',
      'value': -1,
      'type': 'check',
      'current': 0
    },{
      'desc': 'USAF F-15 with F-22 Support (-1)',
      'name': 'f15-with-f22',
      'value': -1,
      'type': 'check',
      'current': 0
    },{
      'desc': 'Non-US/CW/JPN/RU/PRC (+1)',
      'name': 'weaklings',
      'value': 1,
      'type': 'check',
      'current': 0
    },{
      'desc': 'Strike Aircraft firing (+2)',
      'name': 'strike-plane-firing',
      'value': 2,
      'type': 'check',
      'current': 0
    }
  ], 'Air Combat Stand-off and Dogfight DRMs');

  var airCombatDogfightDrms = createDrms('air-combat-dog', [
    {
      'name': 'pilot-skills',
      'type': 'drop',
      'value': 1,
      'min-count': -2,
      'max-count': 1,
      'desc': 'Pilot skill',
      'current': 0
    }
  ], 'Air Combat Dogfight DRMs');

  var airCombatRangeSelector = createModeSelector("Air Combat Range", "air-combat-range-selector", [
    {
      'label': 'Long-Range',
      'name': 'long'
    },{
      'label': 'Stand-Off',
      'name': 'stand'
    },{
      'label': 'Dogfight',
      'name': 'dog'
    }
  ]);

  var advAirCombatResolver = (function () {
    var airCombatTable = {
      '4': ['X', 'X', 'X', 'X', 'X', 'X', 'DA', 'DA', 'A', 'A', 'Ad/D', 'Ad/D'],
      '3': ['X', 'X', 'X', 'X', 'X', 'DA', 'DA', 'A', 'A', 'Ad/D', 'Ad/D'],
      '2': ['X', 'X', 'X', 'X', 'DA', 'DA', 'A', 'A', 'Ad/D', 'Ad/D'],
      '1': ['X', 'X', 'X', 'DA', 'DA', 'A', 'A', 'Ad/D', 'Ad/D'],
      '0': ['X', 'X', 'DA', 'DA', 'A', 'A', 'Ad/D', 'Ad/D'],
      '-1': ['X', 'DA', 'DA', 'A', 'A', 'Ad/D', 'Ad/D'],
      '-2': ['DA', 'DA', 'A', 'Ad/D', 'Ad/D'],
      '-3': ['DA', 'A', 'Ad/D', 'Ad/D'],
      '-4': ['A', 'Ad/D']
    };
    var currentMode;
    var currentDrm = 0;
    var result;
    var dieRoll;

    var resolveAirCombat = function () {
      dieRoll = rollDie(currentDrm);

      var roll = dieRoll['net-roll'];
      if (roll < -2) {
        roll = -2;
      }
      var differential = airCombatDifferentialSelector.getDifferential().toString();
      var netResult = airCombatTable[differential][roll];
      if (netResult === undefined) {
        netResult = "\u2014";
      }
      if (netResult === 'Ad/D') {
        if (currentMode === 'dog') {
          netResult = "D (Ad/D is D in Dogfights)";
        } else {
          netResult = "Ad (Ad/D is Advantage in Long-Range and Stand-Off air combat)";
        }
      }
      result = netResult;
      updateResults();
    };

    var updateResults = function () {
      if (result === undefined) {
        return;
      }
      var html = "<p class=\"result-label\">Die Roll</p><p class=\"value\">" + dieRoll['raw-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Net Roll</p><p class=\"value\">" + dieRoll['net-roll'] + "</p><br>\n" +
        "<p class=\"result-label\">Effect</p><p class=\"value\">" + result + "</p>\n";
      $("#adv-air-combat-result").html(html);
    };

    var getDrms = function () {
      if (currentMode === 'long') {
        return airCombatCommonDrms.sumNetDRM();
      } else if (currentMode == 'stand') {
        return airCombatCommonDrms.sumNetDRM() + airCombatStandDogDrms.sumNetDRM();
      } else if (currentMode == 'dog') {
        return airCombatCommonDrms.sumNetDRM() + airCombatStandDogDrms.sumNetDRM() +
          airCombatDogfightDrms.sumNetDRM();
      }
    };

    var updateDrmDisplay = function () {
      currentDrm = getDrms();
      var currentDrmString;
      if (currentDrm < 0) {
        currentDrmString = currentDrm.toString();
      } else {
        currentDrmString = "+" + currentDrm.toString();
      }
      $("#adv-air-combat-net-drm-value").html(currentDrmString);
    };

    var addResolutionHandler = function () {
      $("#adv-air-combat-dice-roll-button").on('click', function () {
        resolveAirCombat();
      });
    };

    var resetResults = function () {
      result = undefined;
      $("#adv-air-combat-result").html("&nbsp;");
    };

    var drmChangeHandler = function () {
      updateDrmDisplay();
    };

    var setupDrmListener = function () {
      airCombatCommonDrms.attachListener(drmChangeHandler);
      airCombatStandDogDrms.attachListener(drmChangeHandler);
      airCombatDogfightDrms.attachListener(drmChangeHandler);
    };

    return {
      'attachSection': function (selector, mode) {
        if (mode !== currentMode) {
          resetResults();
        }
        currentMode = mode;
        if (!$('.adv-air-combat-resolution').length) {
          var newHtml = "<div class=\"adv-air-combat-resolution modals adv-adf-modals\" id=\"adv-air-combat-resolution\">\n" +
            "<p class=\"heading\">Air Combat Resolution</p>\n<div id=\"adv-air-combat-drm-display\" " +
            "class=\"adv-air-combat-drm-display\">" +
            "<p class=\"result-label\">Current Net DRM:</p><p class=\"value\" id=\"adv-air-combat-net-drm-value\">+0</p>" +
            "</div><input type=\"button\" class=\"dice-roll-button\" " +
            "id=\"adv-air-combat-dice-roll-button\" value=\"Roll Die\">\n<div class=\"adv-air-combat-result\" " +
            "id=\"adv-air-combat-result\">&nbsp;</div></div>\n";
          $(selector).append(newHtml);
          addResolutionHandler();
          setupDrmListener();
        }
        updateDrmDisplay();
        updateResults();
      },
      'reset': function () {
        resetResults();
      },
      'removeResolver': function () {
        $("#adv-air-combat-resolution").remove();
      }
    };
  })();

  var advAirToAirMode = (function () {
    var rangeSelected = false;

    var rangeSelectedHandler = function () {
      rangeSelected = true;
      resetResults();
      drawRequiredSections();
    };

    var resetResults = function () {
    };

    var drawRequiredSections = function () {
      if (!$(".adv-air-combat-modal").length) {
        $(".selected-mode").html("<div class=\"adv-air-combat-modal\" id=\"adv-air-combat-modal\">\n</div>\n");
      }

      airCombatDifferentialSelector.attachSection("#adv-air-combat-modal");
      airCombatCommonDrms.attachSection("#adv-air-combat-modal");
      airCombatStandDogDrms.attachSection("#adv-air-combat-modal");
      airCombatDogfightDrms.attachSection("#adv-air-combat-modal");
      airCombatRangeSelector.attachListener(rangeSelectedHandler);
      airCombatRangeSelector.attachSection("#adv-air-combat-modal");

      if (rangeSelected) {
        advAirCombatResolver.attachSection("#adv-air-combat-modal", airCombatRangeSelector.getSelection());
      }
    };

    return {
      'init': function () {
        rangeSelected = false;
        drawRequiredSections();
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
    $(".selected-mode").html('');  // Torch everything.
  };

  var initSelectedMode = function () {
    if (selectedMode === 'StdADFMode') {
      stdAdfMode.init();
    } else if (selectedMode === 'AdvDetMode') {
      advDetMode.init();
    } else if (selectedMode === 'AdvADFMode') {
      advAdfMode.init();
    } else if (selectedMode === 'AdvInterdictMode') {
      advInterdictionMode.init();
    } else if (selectedMode === 'AdvStrikeMode') {
      advStrikeMode.init();
    } else if (selectedMode === 'AdvAirCombatMode') {
      advAirToAirMode.init();
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

    if (selectedMode == null) {
      changeMode("StdADFMode");
    }
  };

  init();
};