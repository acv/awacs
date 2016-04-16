/**
 * Created by acv on 2016-04-14.
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

  var advDetMode = (function () {
    var missionTypeSelected = false;
    var useLocalAdf = false;
    var missionWasDetected = false;
    var adfTrackToUse;
    var trackLabels = {
      'NormalADF': 'Standard ADF Track',
      'NormalADFNoShoot': 'Standard ADF Track, no SAM or AAA (SR 25.1 #3b)',
      'NormalOrNavalADF': 'Choose Naval or Standard ADF',
      'OptNormalOrNavalADF': 'Naval Umbrella, mix and match Standard and Naval ADF tracks',
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
      'attachSection': function () {
        if (!$("#adf-tracks").length) {
          var html = "<div class=\"adf-tracks modals\" id=\"adf-tracks\">\n" +
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
      'removeTracks': function () {
        $("#adf-tracks").remove();
        $("#adf-track-selected").remove();
      },
      'attachListener': function (listener) {
        listeners.push(listener);
      },
      'getCurrentDetection': function () {
        return adfDetection;
      }
    };
  })();

  var detectionDrms = (function () {
    var drms = [
      {
        'name': 'target-near-hq',
        'type': 'check',
        'value': -1,
        'desc': 'Target within 2 hexes from of Detecting player\'s HQ (-1).',
        'current': 0
      },{
        'name': 'helo-through-hex',
        'type': 'check',
        'value': -1,
        'desc': 'Attack Helicopter/Airmobile Movement pased through Detecting Players\'s occupied hex',
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
    ];
    var listeners = [];
    var that = this;  // Self reference.

    var getInputForDRM = function (drm) {
      var html = '';
      if (drm['type'] === 'check') {
        html += "<input type=\"checkbox\" id=\"" + drm['name'] + "-check\" class=\"drm-checkbox adv-det-drm\">\n";
      } else if (drm['type'] === 'drop') {
        html += "<input type=\"number\" id=\"" + drm['name'] + "-drop\" class=\"drm-drop adv-det-drm\" min=\"0\" " +
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
        if (!$('#adv-det-modifiers').length) {
          var newHtml = "<div class=\"det-modifiers modals adv-det-modals\" id=\"adv-det-modifiers\">\n" +
            "<p class=\"heading\">DRMs</p>\n<ul class=\"drm-modifiers\" id=\"adv-det-drm\">" +
            drmHtmlSnippets() + "\n</ul>\n</div>";
          $(".selected-mode").append(newHtml);
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
        $(".adv-det-drm").each(function (index, element) {
          if ($(element).hasClass('drm-checkbox')) {
            $(element).prop('checked', false);
          } else if ($(element).hasClass('drm-drop')) {
            $(element).prop('value', 0);
          }
        });
      },
      'removeDRMs': function () {
        $("#adv-det-modifiers").remove();
      }
    };
  })();

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
      var rawResult = detectionTable[detection][dieRoll['net-roll']];
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
        currentDrm = detectionDrms.sumNetDRM();
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