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
  var adfDetection = 6;
  var adfSAM = 6;
  var adfAAA = 2;
  var currentAirSup = "contested";
  var validAirSup = {
    'oppSupremacy': '#FF2000',
    'oppSuperiority': '#FF3800',
    'oppAdvantage': '#FF5000',
    'contested': 'white',
    'advantage': 'rgb(120, 170, 255)',
    'superiority': 'rgb(120, 150, 255)',
    'supremacy': 'rgb(120, 120, 255)'
  };
  var currentPlayer = "Allied";

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

  var airSupBoxColor = function (level) {
    var color = validAirSup[level];
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
    refreshAirSupTrack();
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

  var flipPlayer = function () {
    if (currentPlayer === 'Allied') {
      currentPlayer = 'OpFor';
    } else {
      currentPlayer = 'Allied';
    }
    $("#flag-box").css("background-color", getPlayerColor());
    flipAirSupTrack();
  };

  var initFlag = function () {
    $("#flag-box")
      .css('background-color', getPlayerColor())
      .on('click', function () {
        flipPlayer();
      });
  };

  var refreshAdfTracks = function () {
    $("#adf-tracks").find(".box").each(function (index, element) {
      var id = $(element).attr("id").split('-');
      var value = parseInt(id[2]);
      if (id[0] === "det") {
        if (value === adfDetection) {
          $(element).css('background-color', getOtherPlayerColor());
        } else {
          $(element).css('background-color', "white");
        }
      } else if (id[0] === "sam") {
        if (value === adfSAM) {
          $(element).css('background-color', getOtherPlayerColor());
        } else {
          $(element).css('background-color', "white");
        }

      } else if (id[0] === 'aaa') {
        if (value === adfAAA) {
          $(element).css('background-color', getOtherPlayerColor());
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

  var initAdfTracks = function () {
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
    refreshAdfTracks();
  };

  var resetAllModals = function () {
    $(".modals").each(function (index, element) {
      if (!$(element).hasClass('hidden')) {
        $(element).addClass('hidden');
      }
    });
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

    initFlag();
    initAirSupTrack();
    initAdfTracks();

    if (selectedMode == null) {
      changeMode("StdADFMode");
    }
  };

  init();
};