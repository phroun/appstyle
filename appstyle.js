/*!
 * appstyle JavaScript Library v1.0.13
 * https://github.com/phroun/appstyle
 *
 * Copyright Jeffrey R. Day and other contributors
 * Released under the MIT license
 * https://github.com/phroun/appstyle/blob/main/LICENSE
 *
 * First Release: 2021-05-22T16:50Z
 * Last Updated:  2021-07-18
 */

var appstyle = (function() {

  // ==== Sizing and Fonts ====
  var windowFontName = '"Helvetica"';
  var options = {
    customPixZoomFactor: 0,
    uiScaleFactor: 0.25,
    useSystemCursor: true,
    backgroundPaintInterval: 8
  }

  // ==== Color Theme ====
  var theme = {
    colorDesktop: '#222222',
    colorOutline: '#000000',
    colorActiveCharGrid: '#330000',
    colorInactiveCharGrid: '#000000',
    colorInlineActive  : '#ffffff',
    colorInlineInactive: '#999999',
    colorActiveBarBack : '#336699',
    colorActiveBarHigh : '#0099cc',
    colorActiveBarLow  : '#003355',
    colorInactiveBarBack : '#005588',
    colorInactiveBarHigh : '#0088bb',
    colorInactiveBarLow  : '#002244',
    colorActiveBack: '#000000',
    colorInactiveBack: '#181818',
    colorActiveTextFore: '#cccccc',
    colorInactiveTextFore: '#cccccc',
    colorSizerBack: '#339966',
    colorSizerHigh: '#33cc66',
    colorSizerLow: '#006600',
    colorSizerInactive: '#003300',
    colorWindowSurface: '#000000',
    colorHoverWindowSurface: '#333333',
    colorSurfaceEdge: '#000000',
    colorActiveTitle: '#ffffff',
    colorActiveTitleShadow: '#000000',
    colorInactiveTitle: '#999999',
    colorInactiveTitleShadow: '#000000',
    colorActiveTextInputBack: '#000000',
    colorActiveTextInputFore: '#cccccc',
    colorInactiveTextInputBack: '#333333',
    colorInactiveTextInputFore: '#cccccc',
    colorInactiveTextInputEdge: '#000000',
    bevelTint: [0, 0.6, 1]
  }

  // === Internal State Tracking ===
  var pixZoomFactor = 1;
  var superFullScreen = false
  var dpr = 1;
  var systemDPR = 1;
  var sizerThickness = 5;
  var mouseX = -100;
  var mouseY = -100;
  var cursorType = 0;
  var minScaleFactor = 0.25;
  var toolFrameSize = 0.73;
  var halfPixel = true;
  var mouseCaptureWid = -1;
  var focusWid = -1;
  var focusWidget = getWidgetReference(false, -1);
  var focusWidgetLoading = false;
  var focusWidgetStorage = '';
  var lastFocusWid = -1;
  var lastFocusId = -1;
  var windowList = [];
  var widgetClasses = {};
  var windowClasses = {};
  var eventDispatcher = {};
  var modalCallback = false;
  var inTouchEvent = false;
  var initialised = false;
  var needDoResize = false;
  var measuringContext = null;
  var frame = 0;

  // internals exposed for developers:
  var dragdrop = {wid: -1};
  
  var internalState = {
    inputHideMouse: false,
    boundsHideMouse: false,
    mouseOverWid: -1,
    fps: 1,
  }

  function isEmpty(obj) { 
     for (var x in obj) { return false; }
     return true;
  }
  
  function padZ(s) {
    s = s.toString();
    while (s.length < 10) {
      s = '0' + s;
    }
    return s;
  }
  
  var getLocalPos = (function(win, x, y) {
    return({
      x: x - (win.private.cx + 1),
      y: y - (win.private.cy + Math.floor(win.private.titleBarHeight) + 1)
    });
  });
  
  var invalidate = function(win_or_wid) {
    var win;
    if (typeof win_or_wid == "object") {
      win = win_or_wid;
    } else {
      win = windowList[win_or_wid];
    }
    if (win) {
      if (typeof win.private == "undefined") {
        win.private = {};
      }
      win.private.invalidated = true;
    }
  }

  var redraw = function(win) {
    if (win) {
      if (typeof win.private == "undefined") {
        win.private = {};
      }
      win.private.redraw = true;
    }
  }
  
  var triggerEvent = function(win, evt, browserEventObject) {
    var evid = '';
    if (win && win.private) {
      evid = win.private.wid + ':' + evt.type;
      var r = true;
      if (typeof eventDispatcher[evid] == "undefined") {
        eventDispatcher[evid] = true;

        mouseX -= win.private.cx + 1;
        var tbh = 0;
        if (win.private) {
          tbh = win.private.titleBarHeight || 0;
        }
        mouseY -= win.private.cy + Math.floor(tbh) + 1;
        var restoreX = win.private.cx + 1
        var restoreY = win.private.cy + Math.floor(tbh) + 1;
        if (win.event) {
          r = win.event(win, evt, browserEventObject);
          if (typeof r == 'undefined') {
            r = true;
          }
        } else {
          r = true;
        }
        mouseX += restoreX;
        mouseY += restoreY;
        
        delete eventDispatcher[evid];
      }
    }
    return r;
  }
  
  var makeWindow = function(prop, silent) {
    if (typeof prop == "undefined") {
      prop = {};
    }
    var wid = -1;
    var hz = 0;
    for (var i=0; i < windowList.length; i++) {
      if (windowList[i].private.closed) {
        if (wid == -1) {
          wid = i;
        }
      } else {
        if (windowList[i].z > hz) {
          hz = windowList[i].z;
        }
      }
    }
    hz++;

    var template = {}
    if (typeof prop.class != "undefined") {
      var classData = windowClasses[prop.class];
      for (const key in classData) {
        if (classData.hasOwnProperty(key)) {
          template[key] = classData[key];
        }
      }
    }
    for (const key in prop) {
      if (prop.hasOwnProperty(key)) {
        template[key] = prop[key];
      }
    }
    
    if (wid == -1) {
      windowList.push(template);
      wid = windowList.length - 1;
    } else {
      windowList[wid] = template;
    }
    windowList[wid].z = hz;
    windowList[wid].private = {}
    if (typeof windowList[wid].storage == "undefined") {
      windowList[wid].storage = {}
    }
    windowList[wid].private.closed = false;
    if (typeof windowList[wid].titleBar == "undefined") {
      windowList[wid].titleBar = true;
    }
    if (typeof windowList[wid].horizontalSize == "undefined") {
      windowList[wid].horizontalSize = true;
    }
    if (typeof windowList[wid].verticalSize == "undefined") {
      windowList[wid].verticalSize = true;
    }
    if (typeof windowList[wid].w == "undefined") {
      windowList[wid].w = 80;
    }
    if (typeof windowList[wid].h == "undefined") {
      windowList[wid].h = 25;
    }
    if ((typeof windowList[wid].x == "undefined") 
    || (typeof windowList[wid].y == "undefined")) {
      var c = document.getElementById('appstyle_canvas');
      processWindowMetrics(windowList[wid]);
      if (windowList[wid].pixel) {
        windowList[wid].x = Math.floor(Math.random() * Math.max(0, c.width - windowList[wid].private.cw - 4));
        windowList[wid].y = Math.floor(Math.random() * Math.max(0, c.height - windowList[wid].private.ch -
        windowList[wid].private.titleBarHeight - 4));
      } else {
        windowList[wid].x = Math.floor(Math.random() * Math.max(0, c.width - windowList[wid].private.w - 4));
        windowList[wid].y = Math.floor(Math.random() * Math.max(0, c.height - windowList[wid].private.h -
        windowList[wid].private.titleBarHeight - 4));
      }
    }
    if (typeof silent != "undefined") {
      bringToTop(wid);
    }
    return wid;
  }
  
  var canWidgetFocus = function(win, widget) {
    var wc;
    if (widget && widget.class) {
      wc = widgetClasses[widget.class];
    }
    var canFocus = false;
    if (wc && wc.canFocus) {
      canFocus = wc.canFocus(win, widget);
      if (typeof canFocus == "undefinned") {
        canFocus = false;
      }
    }
    return canFocus;
  }
  
  var getCharPos = function(win, x, y) {
    var rx = 0;
    var ry = 0;
    rx = (x + win.private.charOffsetX) * win.private.charWidth;
    ry = (y + win.private.charOffsetY) * win.private.charHeight;
    return {x: rx, y: ry, w: win.private.charWidth, h: win.private.charHeight};
  }
  
  var getCharFromPos = function(win, x, y, truncate) {
    var rx = 0;
    var ry = 0;
    rx = (x / win.private.charWidth) - win.private.charOffsetX;
    ry = (y / win.private.charHeight) - win.private.charOffsetY;
    if ((typeof truncate != "undefined") && truncate) {
      rx = Math.floor(rx);
      ry = Math.floor(ry);
    }
    return {x: rx, y: ry};
  }
  
  function getWidgetIndexById(win, widgetId) {
    if (win && win.private && win.private.widgets) {
      for (var i=0; i < win.private.widgets.length; i++) {
        if (win.private.widgets[i].id == widgetId) {
          return i;
        }
      }
    }
    return -1;
  }

  function getWidgetById(win, widgetId) {
    var i = -1;
    if ((typeof widgetId != "undefined")
    && (widgetId != "")) {
      i = getWidgetIndexById(win, widgetId);
    }
    if (i >= 0) {
      return win.private.widgets[i];
    } else {
      return false;
    }
  }
        
  var getWidgetPos = function(win, widget, absolute) { // return position in pixels
    var px = 0;
    var py = 0;
    var abso = false;
    if (typeof absolute != "undefined") {
      abso = absolute;
    }
    var pwidget = false;
    if (widget) {
      pwidget = getWidgetById(win, widget.parentId);
    }
    var cont = true;
    while (pwidget && cont) {
      var wpos = {x: pwidget.x, y: pwidget.y};
      if (!pwidget.pixel) {
        wpos = getCharPos(win, pwidget.x, pwidget.y);
      }
      px -= wpos.x;
      py -= wpos.y;
      if (typeof pwidget.storage != "undefined") {
        if (win.storage && win.storage[pwidget.storage]) {
          var wst = win.storage[pwidget.storage];
          var ox = 0;
          var oy = 0;
          if (typeof wst.originX != "undefined") {
            ox = wst.originX;
          }
          if (typeof wst.originY != "undefined") {
            oy = wst.originY;
          }
          
          if (typeof wst.charOffsetX != "undefined") {
            ox += wst.charOffsetX;
          } else {
            ox -= win.private.charOffsetX;
          }
          if (typeof wst.charOffsetY != "undefined") {
            oy -= wst.charOffsetY;
          } else {
            oy -= win.private.charOffsetY;
          }

          var cpos = getCharPos(win, ox, oy);
          px += cpos.x;
          py += cpos.y;
        }
      }
      
      if ((typeof pwidget.parentId != "undefined")
      && (pwidget.parentId != "")) {
        pwidget = getWidgetById(win, pwidget.parentId);
      } else {
        pwidget = false;
      }
      cont = abso;
    }
    var rx = 0;
    var ry = 0;
    var rw = 0;
    var rh = 0;
    if (widget.pixel) {
      rx = widget.x;
      ry = widget.y;
      rw = widget.w;
      rh = widget.h;
    } else {
      rx = (widget.x + win.private.charOffsetX) * win.private.charWidth;
      ry = (widget.y + win.private.charOffsetY) * win.private.charHeight;
      rw = widget.w * win.private.charWidth;
      rh = widget.h * win.private.charHeight;
    }
    return {x: rx - px, y: ry - py, w: rw, h: rh};
  }

  function getWidgetAtPos(win, x, y, parentReference) {
    var mpos = {x: x, y: y};
    var r = parentReference;
    var prid = parentReference?.id;
    if (!prid) {
      prid = '';
    }
    for (var i=0; i < win.private.widgets.length; i++) {
      var parid = win.private.widgets[i].parentId;
      if (typeof parid == "undefined") {
        parid = '';
      }
      if (parid == prid) {
        var graven = win.private.widgets[i].graven;
        if ((!graven) && isWithinWidget(win, win.private.widgets[i], mpos.x, mpos.y,
        true)) {
          var widg = win.private.widgets[i];
          r = getWidgetReference(win, i);
          
          var wc = widgetClasses[widg.class];
          if (wc && wc.getWidgetAtPos) {
            var cr = wc.getWidgetAtPos(win, widg, mpos.x, mpos.y, r);
            if (typeof cr != "undefined") {
              r = cr;
            }
          }
        }
      }
    }
    return r;
  }

  function sameWidgetReference(r1, r2) {
    return ((typeof r1 == typeof r2)
    && ((r1 == "undefined")
    || ((r1.wid == r2.wid)
    && (r1.id == r2.id)
    && (r1.currentIndex == r2.currentIndex))
    ));
  }
  
  function getWidgetReference(win, widgetIndex) {
    var ref = {}
    if (!win) {
      ref.wid = -1;
    } else {
      ref.wid = win.private.wid;
    }
    if (win && (widgetIndex >= 0)) {
      var widget = win.private.widgets[widgetIndex];
      if (typeof widget.id == "undefined") {
        ref.id = "";
      } else {
        ref.id = widget.id;
      }
      ref.class = widget.class;
      ref.currentIndex = widgetIndex;
    } else {
      ref.id = "";
      ref.class = "";
      ref.currentIndex = -1;
    }
    return ref;
  }
  
  var isWithinWidget = function(win, widget, x, y, absolute) { // local position
    var pos = getWidgetPos(win, widget, absolute);
    return ((x >= pos.x)
    && (x <= pos.x + pos.w)
    && (y >= pos.y)
    && (y <= pos.y + pos.h));
  }
  
  function drawStripes(ctx, win, leftEdge, rightEdge, topEdge, stripeHeight) {
    var row = 4 + Math.floor(dpr/2);
    ctx.lineWidth = 1;
    if (win.private.active) {
      ctx.strokeStyle = theme.colorActiveBarHigh;
    } else {
      ctx.strokeStyle = theme.colorInactiveBarHigh;
    }
    ctx.beginPath();      
    for (var y=0; y*row < stripeHeight; y++) {
      ctx.moveTo(leftEdge,      1 + topEdge + y*row);
      ctx.lineTo(leftEdge,      0 + topEdge + y*row);
      ctx.lineTo(rightEdge - 1, 0 + topEdge + y*row);
    }
    ctx.stroke();

    if (win.private.active) {
      ctx.strokeStyle = theme.colorActiveBarLow;
    } else {
      ctx.strokeStyle = theme.colorInactiveBarLow;
    }
    ctx.beginPath();
    for (var y=0; y*row < stripeHeight; y++) {
      ctx.moveTo(leftEdge + 1, topEdge+2 + y*row);
      ctx.lineTo(rightEdge,    topEdge+2 + y*row);
      ctx.lineTo(rightEdge,    topEdge+1 + y*row);
    }
    ctx.stroke();
  }


  // WINDOW FRAME DECORATOR
  function windowFrame(ctx, win) {
    if (typeof win.private == "undefined") {
      return; // need metrics first
    }
    
    
    var uiScale = options.uiScaleFactor;
    if (uiScale < minScaleFactor) {
      uiScale = minScaleFactor;
    }
    var originalScale = uiScale;
    
    if ((typeof win.toolFrame != "undefined") 
    && win.toolFrame) {
      uiScale = uiScale * toolFrameSize;
    }
    
    ctx.save();
    ctx.lineWidth   = 1;
    
    var recon = false;
    var retain = win.retain || false;
    var redraw = win.private.redraw || false;

    if (typeof win.immediate != "undefined") {
      if (typeof win.immediate == "number") {
        if ((typeof win.private.invfc == "undefined")
        || (win.private.invfc <= 0)) {
          win.private.invalidated = true;
          win.private.invfc = Math.max(1, win.immediate);
        }
        win.private.invfc--;
      } else {
        win.private.invalidated = true;
      }
    }
    
    if (((typeof win.private.invalidated != "undefined") && (win.private.invalidated))
    || (typeof win.private.widgets == "undefined")) {
      recon = true;
      win.private.invalidated = false;
      setWidgetDefaults(win, {});
      win.private.widgets = [];
    }

    if (!(win.private.collapsed)) {
    
      if ((typeof win.windowFrameEdge == "undefined")
      || (win.windowFrameEdge)) {
        // Outer Window Frame
        ctx.strokeStyle = theme.colorOutline;
        ctx.beginPath();
        ctx.rect(
          win.private.cx-1,win.private.cy-1,win.private.w + 2 + win.private.hSizer,
          win.private.h+3+ win.private.titleBarHeight + win.private.vSizer);
        ctx.stroke();
        
        // Inner Window Frame
        ctx.beginPath();
        ctx.rect(win.private.cx, win.private.cy, win.private.w + 0 + win.private.hSizer, win.private.h + 1 + win.private.titleBarHeight + win.private.vSizer);
        if (win.private.active) {
          ctx.strokeStyle = theme.colorInlineActive;
        } else {
          ctx.strokeStyle = theme.colorInlineInactive;
        }
        ctx.stroke();
      }
    }

    ctx.translate(win.private.cx, win.private.cy + Math.floor(win.private.titleBarHeight));

    var barZone = win.private.titleBarHeight + 2;
    
    if (win.private.mouseInFlag) {
      if (recon) {
        win.private.widgets.push({class: 'windowBorder', pixel: true, x: -1, y: -win.private.titleBarHeight, w: win.private.w+5 +
        win.private.hSizer, h: win.private.h + win.private.titleBarHeight + win.private.vSizer});
        win.private.widgets.push({class: 'window', pixel: true, x: 0, y: 0, w: win.private.w-1, h: win.private.h-1});
      }
    }
    
    measuringContext = ctx;
    
    if (win.widgets && recon) {
      win.widgets(win);
    }

    if (win.private.mouseInFlag
    && (typeof win.titleBar != "undefined")
    && win.titleBar) {
    
      if (recon) {
        win.private.widgets.push(
          {
            class: 'titleBar',
            pixel: true,
            x: -1,
            y: 0 - barZone,
            w: win.private.w+1,
            h: barZone - 1
          }
        );
      }

      var cdpr = Math.min(2, Math.max(1, dpr)) - 1;
      var closeEdge = Math.ceil(12*uiScale); // Math.floor(topEdge * 0.6);
      var innerTitleZone = barZone - 5;
      var stripeCount = Math.floor((innerTitleZone*0.82 - (3+cdpr)) / (4+cdpr));
      if (stripeCount > 3) { stripeCount--; }
      var stripeHeight = (Math.max(0, stripeCount) * (4+cdpr)) + 3;
      var topEdge = Math.ceil(Math.max(1, (barZone - stripeHeight) / 2)) + 1;
      var leftEdge = 16*uiScale;
      var rightEdge = win.private.w - 40;
      rightEdge -= sizerThickness;

      ctx.lineWidth = 1;

      if (!win.noCloseBtn) {
        // Widget Region for Close Button
        
        if (recon) {
          win.private.widgets.push(
            {
              class: 'closeBtn',
              pixel: true,
              x: Math.floor(closeEdge) + 0.5,
              y: Math.floor(closeEdge) + 0.5 - barZone,
              w: Math.floor(barZone - closeEdge*2),
              h: Math.floor(barZone - closeEdge*2)
            }
          );
        }

      }
    }
    
    if (recon) {

      if (win.private.hSizer > 0) {
        win.private.widgets.push(
          {
            class: 'hSizer',
            pixel: true,
            x: win.private.w,
            y: 0 - barZone,
            w: win.private.hSizer + 2,
            h: barZone - 1
          }
        );
        win.private.widgets.push(
          {
            class: 'hSizer',
            pixel: true,
            x: win.private.w,
            y: 0,
            w: win.private.hSizer + 2,
            h: win.private.h
          }
        );
      }

      if (win.private.vSizer > 0) {
        win.private.widgets.push(
          {
            class: 'vSizer',
            pixel: true,
            x: 0,
            y: win.private.h,
            w: win.private.w,
            h: win.private.vSizer
          }
        );
      }
      if ((win.private.vSizer > 0) && (win.private.hSizer > 0)) {
        win.private.widgets.push(
          {
            class: 'xSizer',
            pixel: true,
            x: win.private.w,
            y: win.private.h - win.private.vSizer * 2,
            w: win.private.hSizer,
            h: win.private.vSizer * 3
          }
        );
        win.private.widgets.push(
          {
            class: 'xSizer',
            pixel: true,
            x: win.private.w - win.private.hSizer * 2,
            y: win.private.h,
            w: win.private.hSizer * 3,
            h: win.private.vSizer
          }
        );
      }
    } // recon

    var mouseIn = getWidgetReference(win, -1);
    var mpos = getLocalPos(win, mouseX, mouseY);

    mouseIn = getWidgetAtPos(win, mpos.x, mpos.y, mouseIn);
    var otarg = win.private.mouseTarget;
    win.private.mouseTarget = mouseIn;
    if (!sameWidgetReference(otarg, mouseIn)) {
      invalidate(win);
      if (mouseIn.wid) {
        invalidate(mouseIn.wid);
      }
    }
    
    var prel = win.private.mouseElement;
    
    if (dragdrop.wid == -1) {
      win.private.mouseElement = mouseIn;
    } else {
      if (win.private.dragdrop) {
        win.private.mouseElement = dragdrop.source;
      } else {
        win.private.mouseElement = getWidgetReference(win, -1);
      }
    }
    
    if (!sameWidgetReference(prel,win.private.mouseElement)) {
      invalidate(win);
      if (prel && prel.wid) {
        invalidate(prel.wid);
      }
    }

    if ((typeof win.titleBar != "undefined")
    && win.titleBar) {
    
      // Background of Title Bar
      ctx.lineWidth = 0;
      if (win.private.active) {
        ctx.fillStyle = theme.colorActiveBarBack;
      } else {
        ctx.fillStyle = theme.colorInactiveBarBack;
      }
      ctx.beginPath();
      ctx.rect(0.5-1,1.5-barZone,win.private.w+1,win.private.titleBarHeight);
      ctx.fill();
      
      // Bottom and Right edge Lowlight      
      ctx.lineWidth = 1;//Math.ceil(2 * uiScale);

      if (win.private.active) {
        ctx.fillStyle = theme.colorActiveBarLow;
      } else {
        ctx.fillStyle = theme.colorInactiveBarLow;
      }
      ctx.beginPath();
      var vsf = 0;
      if (win.private.hSizer > 0) {
        vsf = -1;
      }
      ctx.moveTo(-0.5 + 5*uiScale,       -0.5); // bottom left
      ctx.lineTo(win.private.w+0.5+vsf,  -0.5); // bottom right
      ctx.lineTo(win.private.w+0.5+vsf,             2 - barZone + 5*uiScale); // top right
      ctx.lineTo(win.private.w+0.5+vsf - 5*uiScale, 2 - barZone + 5*uiScale); // inside top right
      ctx.lineTo(win.private.w+0.5+vsf - 5*uiScale, -5*uiScale - 0.5); // inside bottom right
      ctx.lineTo(-0.5 + 5*uiScale,                  -5*uiScale - 0.5);
      ctx.closePath();
      ctx.fill();

      // Top and Left edge Highlight
      if (win.private.active) {
        ctx.fillStyle = theme.colorActiveBarHigh;
      } else {
        ctx.fillStyle = theme.colorInactiveBarHigh;
      }
      ctx.beginPath();
      ctx.moveTo(win.private.w+0.5 + vsf - 5*uiScale, 1.5 - barZone); // top right
      ctx.lineTo(-0.5, 1.5 - barZone); // top left
      ctx.lineTo(-0.5, -1 - 5*uiScale); // bottom left
      ctx.lineTo(5*uiScale - 0.5, -1 - 5*uiScale); //  inside bottom left
      ctx.lineTo(5*uiScale - 0.5, 2 - barZone + 5*uiScale); // inside top left
      ctx.lineTo(win.private.w+0.5 + vsf - 5*uiScale, 1.5 - barZone + 5*uiScale); // inside top right
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 0;

      if (win.private.hSizer > 0) {
        ctx.beginPath();
        if (win.private.active) {
          ctx.fillStyle = theme.colorActiveBarBack;;
        } else {
          ctx.fillStyle = theme.colorInactiveBarBack;
        }
        ctx.rect(win.private.w+0.5,1.5-barZone,win.private.hSizer-1,win.private.titleBarHeight + 0.5);
        ctx.fill();
        ctx.beginPath();
        if (win.private.active) {
          ctx.fillStyle = theme.colorActiveBarHigh;
        } else {
          ctx.fillStyle = theme.colorInactiveBarHigh;
        }
        ctx.rect(win.private.w-0.5,1.5-barZone,2.5*uiScale,win.private.titleBarHeight + 0.5);
        ctx.fill();
        ctx.beginPath();
        if (win.private.active) {
          ctx.fillStyle = theme.colorActiveBarLow;
        } else {
          ctx.fillStyle = theme.colorInactiveBarLow;
        }
        ctx.rect(win.private.w-0.5+win.private.hSizer-2.5*uiScale,1.5-barZone,2.5*uiScale+1,win.private.titleBarHeight + 0.5);
        ctx.fill();
      }
      
      // Divider between title bar and content
      ctx.fillStyle = theme.colorSurfaceEdge;
      ctx.beginPath();
      if (win.private.hSizer > 0) {
        ctx.rect(-0,win.private.titleBarHeight + 1.5 -
        barZone,win.private.w+1+win.private.hSizer,1);
      } else {
        ctx.rect(-0,win.private.titleBarHeight + 1.5 -
        barZone,win.private.w+0,1);
      }
      ctx.fill();

      var cdpr = dpr;
      var closeEdge = Math.ceil(12*uiScale); // Math.floor(topEdge * 0.6);
      var innerTitleZone = barZone - 5;
      var stripeCount = Math.floor((innerTitleZone*0.82 - (3+cdpr)) / (4+cdpr));
      if (stripeCount > 3) { stripeCount--; }
      var stripeHeight = (Math.max(0, stripeCount) * (4+cdpr)) + 3;
      var topEdge = Math.ceil(Math.max(1, (barZone - stripeHeight) / 2)) + 1;
      var leftEdge = 16*uiScale;
      var rightEdge = win.private.w - 16*uiScale;
      topEdge -= Math.floor(1/dpr); // 0 if bigger than 1 dpr

      // draw Close Button
      
      if (!win.noCloseBtn) {
        ctx.beginPath();
        if (win.private.active) {
          ctx.fillStyle = theme.colorActiveBarLow;
        } else {
          ctx.fillStyle = theme.colorInactiveBarLow;
        }

        var bw = 5*uiScale;
        ctx.rect(
          Math.floor(closeEdge) + 0.5, Math.floor(closeEdge) + 0.5 - barZone,
          Math.floor(barZone - closeEdge*2), Math.floor(barZone - closeEdge * 2)
        );
        ctx.fill();
        ctx.beginPath();
        if (win.private.active) {
          ctx.fillStyle = theme.colorActiveBarBack;
        } else {
          ctx.fillStyle = theme.colorInactiveBarBack;
        }
        if ((win.private.mouseTarget.class == 'closeBtn') && (dragdrop.wid == -1)) {
          if (win.private.active) {
            ctx.fillStyle = theme.colorActiveBarHigh;
          } else {
            ctx.fillStyle = theme.colorInactiveBarHigh;
          }
        }
        if (win.private.dragdrop) {
          if ((win.private.mouseElement.class == 'closeBtn')
          && (win.private.mouseTarget.class == 'closeBtn')) {
            if (win.private.active) {
              ctx.fillStyle = theme.colorActiveBarLow;
            } else {
              ctx.fillStyle = theme.colorInactiveBarLow;
            }
          }
        }
        ctx.rect(
          Math.floor(closeEdge) + bw + 0.5, Math.floor(closeEdge) + bw + 0.5 - barZone,
          Math.floor(barZone - bw*2 - closeEdge*2), Math.floor(barZone - bw*2 - closeEdge * 2)
        );
        ctx.fill();
      }
      
      var farLeft = barZone;
      if (win.noCloseBtn) {
        farLeft = 2 + win.private.hSizer; 
      }
      var stripeBegin = farLeft;

      var fontSize = (innerTitleZone*0.8) - 2;
      var compSize = 0;
      if (fontSize <= 11) {
        fontSize = 11;
      }
      var remainder = innerTitleZone - (fontSize*0.9);
      compSize = Math.ceil(remainder/2);
      ctx.font = (fontSize) + 'px ' + windowFontName;
      ctx.textBaseline = 'top';
      
      var spaceWidth = Math.floor(20*uiScale/pixZoomFactor);
      if (win.title > '') {
        stripeBegin += spaceWidth;
        
        // stripes between close button and title
        stripeBegin = barZone + spaceWidth + spaceWidth*3;
        if (stripeBegin > rightEdge) {
          stripeBegin = rightEdge;
        }
        if (farLeft < stripeBegin) {
          drawStripes(ctx, win, farLeft, stripeBegin, - barZone + topEdge, stripeHeight);
        }
        stripeBegin += spaceWidth * 1.5;

        // title
        if (win.private.active) {
          ctx.fillStyle = theme.colorActiveTitleShadow;
        } else {
          ctx.fillStyle = theme.colorInactiveTitleShadow;
        }
        ctx.fillText(win.title,
          -2 + stripeBegin,
          2 + compSize - barZone,
          win.private.w+1 - 200*uiScale
        );
        if (win.private.active) {
          ctx.fillStyle = theme.colorActiveTitle;
        } else {
          ctx.fillStyle = theme.colorInactiveTitle;
        }
        ctx.fillText(win.title,
          -4 + stripeBegin,
          0 + compSize - barZone,
          win.private.w+1 - 200*uiScale
        );
        
        var text = ctx.measureText(win.title);
        var textwidth = text.width;
        if (textwidth > win.private.w+1 - 200*uiScale) {
          textwidth = win.private.w+1 - 200*uiScale;
        }
        
        stripeBegin += textwidth + spaceWidth;
      }

      // stripes from title to right edge
      if (stripeBegin < farLeft) {
        stripeBegin = farLeft;
      }
      if (stripeBegin < rightEdge) {
        drawStripes(ctx, win, stripeBegin, rightEdge, - barZone + topEdge, stripeHeight);
      }
    }
    
    if (!(win.private.collapsed)) {
      if (win.private.hSizer > 0) {
        ctx.beginPath();
        ctx.fillStyle = theme.colorSizerBack;
        if (!win.private.active) {
          ctx.fillStyle = theme.colorSizerLow;
        }
        ctx.rect(win.private.w-0.5,+0.5,win.private.hSizer, win.private.h+1);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = theme.colorSizerHigh;
        if (!win.private.active) {
          ctx.fillStyle = theme.colorSizerBack;
        }
        ctx.rect(win.private.w-0.5,+0.5,2.5*uiScale,win.private.h+1);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = theme.colorSizerLow;
        if (!win.private.active) {
          ctx.fillStyle = theme.colorSizerInactive;
        }
        ctx.rect(win.private.w-0.5+win.private.hSizer-2.5*uiScale,0.5,2.5*uiScale+1,win.private.h+1);
        ctx.fill();
      }
      if (win.private.vSizer > 0) {
        ctx.beginPath();
        ctx.fillStyle = theme.colorSizerBack;
        if (!win.private.active) {
          ctx.fillStyle = theme.colorSizerLow;
        }
        ctx.rect(-0.5,win.private.h+0.5,win.private.w+1,win.private.vSizer-0.5);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = theme.colorSizerHigh;
        if (!win.private.active) {
          ctx.fillStyle = theme.colorSizerBack;
        }
        ctx.rect(-0.5,win.private.h+0.5,win.private.w+1,3*uiScale - 0.5);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = theme.colorSizerLow;
        if (!win.private.active) {
          ctx.fillStyle = theme.colorSizerInactive;
        }
        ctx.rect(-0.5,win.private.h+0.5+win.private.vSizer-2.5*uiScale,win.private.w+1+win.private.hSizer,2.5*uiScale + 1);
        ctx.fill();
      }
      if ((win.private.hSizer > 0) && (win.private.vSizer > 0)) { // Corner Sizer
        ctx.beginPath();
        ctx.fillStyle = theme.colorSurfaceEdge;
        ctx.rect(win.private.w-1,win.private.h,win.private.hSizer+2,win.private.vSizer+2);
        ctx.fill();
        ctx.beginPath();
        ctx.lineWidth = 4 - (pixZoomFactor);
        ctx.strokeStyle = theme.colorSurfaceEdge;
        ctx.moveTo(win.private.w-1-win.private.hSizer,win.private.h+2+win.private.vSizer); // bottom left
        ctx.lineTo(win.private.w+1+win.private.hSizer,win.private.h+0.5  -win.private.vSizer); // top right
        ctx.stroke();
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = theme.colorSizerHigh;
        ctx.fillStyle = theme.colorSizerBack;
        ctx.moveTo(win.private.w-1.5-win.private.hSizer,win.private.h+1.5 +win.private.vSizer); // bottom left
        ctx.lineTo(win.private.w+0.5+win.private.hSizer,win.private.h-0.5 -win.private.vSizer); // top right
        ctx.lineTo(win.private.w+0.5+win.private.hSizer,win.private.h+1.5 +win.private.vSizer); // bottom right
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(win.private.w+0-win.private.hSizer,win.private.h+1+win.private.vSizer); // bottom left
        ctx.lineTo(win.private.w+0+win.private.hSizer,win.private.h+1-win.private.vSizer); // top right
        ctx.stroke();
      }
    }
    
    var can;
    var con;

    if (retain) {
      if (typeof win.private.canvas == "undefined") {
        win.private.canvas = document.createElement('canvas');
        redraw = true;
      }
      can = win.private.canvas;
    }

    // set up clip area for the window paint handler
    ctx.beginPath();
    if (win.private.collapsed) {
      ctx.rect(0.5, 0.5, win.private.w - 1, 0);
    } else {
      ctx.rect(0.5, 0.5, win.private.w - 1, win.private.h);
    }
    ctx.clip();

    if (retain) {
      if (redraw) {
        win.private.redraw = false;
        can.width = win.private.w;
        can.height = win.private.h + 1;
        con = can.getContext('2d', { alpha: false });
        con.imageSmoothingEnabled = false;
        con.mozImagSmoothingEnabled = false;
        con.webkitImageSmoothingEnabled = false;
        con.textBaseline = 'top';
        con.scale(1,1);
        if (halfPixel) {
          con.translate(-0.5, -0.5);
        }
/*        try {
          p = con.getImageData(1, 1, 1, 1).data;
        } catch(err) {
        }*/
        con.save();

        if (win.paint) {
          win.paint(win, con);
        } else {
          drawBackground(win, con);
          drawWidgets(win, con);
        }
        con.restore();
      }
    }
    
    ctx.beginPath();
    if (retain) {
      if (can && can.width && can.height) {
        ctx.drawImage(can, 0, 0);
      }
    } else {
      if (win.paint) {
        win.paint(win, ctx);
      } else {
        drawBackground(win, ctx);
        drawWidgets(win, ctx);
      }
    }

    uiScale = originalScale;

    // remove clipping
    ctx.restore();
  }

  var processWindowMetrics = function(win, ctx) {
    if (typeof win.private == "undefined") {
      win.private = {}
    }
    if (typeof win.storage == "undefined") {
      win.storage = {}
    }
    if (typeof win.private.mouseElement == "undefined") {
      win.private.mouseElement = getWidgetReference(false, -1);
    }
    if (typeof win.private.mouseTarget == "undefined") {
      win.private.mouseTarget = getWidgetReference(false, -1);
    }
    if (typeof win.private.focusWidget == "undefined") {
      win.private.focusWidget = getWidgetReference(false, -1);
    }
    if (typeof win.private.cx == "undefined") {
      win.private.cx = win.x;
    }
    if (typeof win.private.cy == "undefined") {
      win.private.cy = win.y;
    }
    if (typeof win.private.originX == "undefined") {
      win.private.originX = 0;
    }
    if (typeof win.private.originY == "undefined") {
      win.private.originY = 0;
    }
    if (typeof win.private.panelDepth == "undefined") {
      win.private.panelDepth = 0;
    }
    if (win.w <= 0) {
      win.w = 10;
    }
    if (win.h <= 0) {
      win.h = 10;
    }
    if (typeof win.private.cw == "undefined") {
      win.private.cw = win.w;
    }
    if (typeof win.private.ch == "undefined") {
      win.private.ch = win.h;
    }
    if (typeof win.charOffsetX == "undefined") {
      win.private.charOffsetX = 0.5;
    } else {
      win.private.charOffsetX = win.charOffsetX;
    }
    if (typeof win.charOffsetY == "undefined") {
      win.private.charOffsetY = 0.1;
    } else {
      win.private.charOffsetY = win.charOffsetY;
    }
    if (typeof win.charWidth == "undefined") {
      win.private.charWidth = Math.ceil((24 * options.uiScaleFactor));
    } else {
      win.private.charWidth = win.charWidth;
    }
    if (typeof win.charHeight == "undefined") {
      win.private.charHeight = Math.ceil((48 * options.uiScaleFactor));
    } else {
      win.private.charHeight = win.charHeight;
    }

    var barTicks = 0;
    if ((typeof win.titleBar != "undefined")
    && (win.titleBar)) {
      barTicks = 70;
    }
    var uiScale = options.uiScaleFactor;
    if (uiScale < minScaleFactor) {
      uiScale = minScaleFactor;
    }
    var originalScale = uiScale;
    
    if ((typeof win.toolFrame != "undefined") 
    && win.toolFrame) {
      uiScale = uiScale * toolFrameSize;
    }
    if (win.titleBar) {
      win.private.titleBarHeight = Math.floor((barTicks) * uiScale - 2);
    } else {
      win.private.titleBarHeight = 0;
    }

    var tw = Math.max(0, win.private.cw);
    var th = Math.max(0, win.private.ch);
    
    if (win.private.collapsed) {
      if (win.titleBar) {
        if (!win.pixel) { // reverse-engineer it so it calculates right below
          var pos = getCharFromPos(win, 0, -2);
          win.private.h = 0;
          th = pos.y;
        } else {
          win.private.h = 0;
          th = -2;
        }
      }
    }

    var c = document.getElementById('appstyle_canvas');
    if ((typeof win.pixel == "undefined") || (!win.pixel)) {
      var pos = getCharPos(win, tw, th);
      tw = pos.x;
      th = pos.y;
      var maxw = c.width - 10*options.uiScaleFactor;
      var maxh = c.height - 10*options.uiScaleFactor - (win.private.titleBarHeight || 0);
      if (win.verticalSize) {
        th = Math.max(0, Math.min(maxh, th));
      }
      if (win.horizontalSize) {
        tw = Math.max(0, Math.min(maxw, tw));
      }
      win.private.w = Math.floor(tw);
      win.private.h = Math.floor(th);
      var cfp = getCharFromPos(win, tw, th, false);
      win.vw = cfp.x;
      win.vh = cfp.y;      

      win.private.gw = win.private.w;
      win.private.gh = win.private.h;

    } else {

      // are the min and max nested backwards?
      var maxw = c.width - 10*options.uiScaleFactor;
      var maxh = c.height - 10*options.uiScaleFactor - win.private.titleBarHeight;
      win.private.w = tw;
      win.private.h = th;
      if (win.horizontalSize) {
        win.private.w = Math.floor(Math.floor(Math.min(maxw, Math.max(50, tw))));
      }
      if (win.verticalSize) {
        win.private.h = Math.floor(Math.min(maxh, Math.max(1, th)));
      }
      win.vw = win.private.w;
      win.vh = win.private.h;

      win.private.gw = win.private.w;
      win.private.gh = win.private.h;
    }

    var sizerThickness = originalScale*12;
    var hSizer = 0;
    if ((typeof win.horizontalSize != "undefined")
    && win.horizontalSize) {
      hSizer = Math.ceil(sizerThickness);
    }
    var vSizer = 0;
    if ((typeof win.verticalSize != "undefined")
    && win.verticalSize) {
      vSizer = Math.ceil(sizerThickness);
    }
    if ((typeof win.private.collapsed != "undefined")
    && win.private.collapsed) {
      vSizer = 0;
    }
    win.private.hSizer = hSizer;
    win.private.vSizer = vSizer;
  }
  
  function drawWindowStack(c, ctx) {
    var keys = [];
    var buckets = [];
    for (var i=0; i < windowList.length; i++) {
      if (windowList[i].metrics) {
        windowList[i].metrics(windowList[i]);
      }
      processWindowMetrics(windowList[i]);
      windowList[i].private.wid = i;
      if (typeof buckets['z' + padZ(windowList[i].z)] == "undefined") {
        buckets['z' + padZ(windowList[i].z)] = [];
        buckets['z' + padZ(windowList[i].z)].push(i);
        keys.push('z' + padZ(windowList[i].z));
      }
    }
    keys.sort();
    
    var omowid = internalState.mouseOverWid;    
    internalState.mouseOverWid = -1;
    var lk = -1;
    
    for (var i=0; i < keys.length; i++) {
      if (keys[i] != lk) {
        lk = keys[i];
        for (var j=0; j < buckets[lk].length; j++) {
          var wid = buckets[lk][j];
          windowList[wid].private.mouseInFlag = false;
          if (!windowList[wid].private.closed) {
            var win = windowList[wid];

            if ((mouseX >= windowList[wid].private.cx)
            && (mouseX < windowList[wid].private.cx + windowList[wid].private.gw+2 +
            windowList[wid].private.hSizer)
            && (mouseY >= windowList[wid].private.cy)
            && (mouseY < windowList[wid].private.cy + windowList[wid].private.gh+2 +
            windowList[wid].private.titleBarHeight +
            windowList[wid].private.vSizer)) {
              internalState.mouseOverWid = wid;
            }
          }
        }
      }
    }
    
    if (internalState.mouseOverWid != omowid) {
      invalidate(internalState.mouseOverWid);
      invalidate(omowid);
    }
    
    if (internalState.mouseOverWid >= 0) {
      windowList[internalState.mouseOverWid].private.mouseInFlag = true;
    }

    var lk = -1;
    var newz = 0;
    for (var i=0; i < keys.length; i++) {
      if (keys[i] != lk) {
        lk = keys[i];
        for (var j=0; j < buckets[lk].length; j++) {
          var wid = buckets[lk][j];
          newz++;
          windowList[wid].z = newz;
          if (!windowList[wid].private.closed) {
            windowFrame(ctx, windowList[wid]);
          }
        }
      }
    }
  }

  function updateCanvas(c) {

    var focused = document.activeElement;
    if (focused) {
      if (focused.id == 'focus_first') {
        if (focusWid != -1) {
          var r = triggerEvent(windowList[focusWid], {type:'focusFirst'});
          if (r) {
            var found = false;
            var widg = windowList[focusWid]?.private?.widgets;
            if (widg?.length) {
              for (var i=0;i < widg.length; i++) {
                if (canWidgetFocus(windowList[focusWid], widg[i])) {
                  // set focus
                  windowList[focusWid].private.focusWidget = getWidgetReference(windowList[focusWid], i);
                  windowList[focusWid].private.focusWidgetWait = true;
                  break;
                }
              }
            }
          }
        }
      }
      if (focused.id == 'focus_last') {
        if (focusWid != -1) {
          var r = triggerEvent(windowList[focusWid], {type:'focusLast'});
          if (r) {
            var found = false;
            var widg = windowList[focusWid].private.widgets;
            for (var i=widg.length-1;i>=0;i--) {
              if (canWidgetFocus(windowList[focusWid], widg[i])) {
                // set focus
                windowList[focusWid].private.focusWidget = getWidgetReference(windowList[focusWid], i);
                windowList[focusWid].private.focusWidgetWait = true;
                break;
              }
            }
          }
        }
      }
      if (focusWid == lastFocusWid) {
        if (focused.id == 'focus_pre') {
          document.activeElement.blur();
          var lfe = lastFocusId;
          var r = triggerEvent(windowList[lastFocusWid], {type:'focusPrior', last: lastFocusId});
          // go to previous element
          if (r) {
            var found = false;
            var drop = true;
            var widg = windowList[lastFocusWid].private.widgets;
            for (var i=widg.length-1;i>=0;i--) {
              if (found) {
                if (canWidgetFocus(windowList[lastFocusWid], widg[i])) {
                  drop = false;
                  // set focus
                  windowList[lastFocusWid].private.focusWidget = getWidgetReference(windowList[lastFocusWid], i);
                  windowList[lastFocusWid].private.focusWidgetWait = true;
                  break;
                }
              }
              if (widg[i].id == lfe) {
                found = true;
              }
            }
            if (drop) {
              var fr = document.getElementById('focus_rest');
              if (fr) {
                fr.focus();
              }
            }
          }
        }
        if (focused.id == 'focus_post') {
          document.activeElement.blur();
          var lfe = lastFocusId;
          var r = triggerEvent(windowList[lastFocusWid], {type:'focusNext', last: lastFocusId});
          // go to next element
          if (r) {
            var found = false;
            var drop = true;
            var widg = windowList[lastFocusWid].private.widgets;
            for (var i=0;i < widg.length;i++) {
              if (found) {
                if (canWidgetFocus(windowList[lastFocusWid], widg[i])) {
                  drop = false;
                  // set focus
                  windowList[lastFocusWid].private.focusWidget = getWidgetReference(windowList[lastFocusWid], i);
                  windowList[lastFocusWid].private.focusWidgetWait = true;
                  break;
                }
              }
              if (widg[i].id == lfe) {
                found = true;
              }
            }
            if (drop) {
              var fr = document.getElementById('focus_rest');
              if (fr) {
                fr.focus();
              }
            }
          }
        }
      }
      if (focused.tagName == 'BODY') {
        if ( window.location == window.parent.location ) { // allow fiddle
          var fr = document.getElementById('focus_rest');
          fr.focus();
        }
      }
    }
    
    var txt = document.getElementById('appstyle_textinput');
    if (txt) {
      if (!txt.dataset.init) {
        txt.addEventListener('change', ev_textchange, false);
        txt.addEventListener('focus', ev_textfocus, false);
        txt.addEventListener('blur', ev_textblur, false);
        txt.addEventListener('pointermove', ev_mousemove, false);
        txt.addEventListener('pointerup', ev_mouseup, false);
        txt.dataset.init = true;
      }
    }


    cursorType = -1;
    var clipper = document.getElementById('appstyle_clipper');
    if (clipper) {
      clipper.scrollTop = 0;
      clipper.scrollLeft = 0;
    }

    var ctx = c.getContext('2d', { alpha: false});
    ctx.imageSmoothingEnabled = false;
    ctx.mozImagSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.save();
    ctx.textBaseline = 'top';

    ctx.scale(1,1);
    if (halfPixel) {
      ctx.translate(0.5, 0.5);
    }
/*    try {
      p = ctx.getImageData(1, 1, 1, 1).data;
    } catch(err) {
    }*/

    ctx.lineWidth = 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = Math.ceil(options.uiScaleFactor*50 * dpr / pixZoomFactor) + 'px Arial';
    frame++;
    if (frame % options.backgroundPaintInterval) {
      ctx.fillStyle = theme.colorDesktop;
      ctx.fillRect(-1, -1, c.width+1, c.height+1);
    }
    var r = false;
    if (appstyle.paintDesktopHook) {
      r = appstyle.paintDesktopHook(ctx, c.width, c.height);
    }
    drawWindowStack(c, ctx);

    if (((dragdrop.wid == internalState.mouseOverWid) || (dragdrop.wid == -1)) && (internalState.mouseOverWid != -1)) {
      var win = windowList[internalState.mouseOverWid];
      if ((win.private.mouseElement.class == 'titleBar')
      || (win.private.mouseElement.class == 'windowBorder')
      || (win.private.mouseElement.class == 'hSizer')
      || (win.private.mouseElement.class == 'vSizer')
      || (win.private.mouseElement.class == 'xSizer')
      || (win.private.mouseElement.class == 'closeBtn')) {
        if ((dragdrop.wid == -1) || (dragdrop.wid == internalState.mouseOverWid)) {
          cursorType = 0;
          if (win.private.mouseElement.class == 'hSizer') {
            cursorType = 2;
          }
          if (win.private.mouseElement.class == 'vSizer') {
            cursorType = 3;
          }
          if (win.private.mouseElement.class == 'xSizer') {
            cursorType = 4;
          }
        }
      } else {
        var wc = widgetClasses[win.private.mouseElement.class];
        var widg = win.private.widgets[win.private.mouseElement.currentIndex];
        if (widg && widg.cursor) {
          cursorType = widg.cursor;
        }
        if (wc && wc.getMouseCursor) {
          var widgCursorType = wc.getMouseCursor(win, ctx, widg);
          if (typeof widgCursorType != "undefined") {
            cursorType = widgCursorType;
          }
        }
        if (cursorType == -1) {
          if (typeof win.cursor != "undefined") {
            cursorType = win.cursor;
          }
        }
      }
    }
    if (cursorType == -1) {
      cursorType = 0;
    }
    
    if (options.useSystemCursor) {
      // convert cursorType into a system cursor
      var sysCursor = 'default';
      if (cursorType == -1) {
        sysCursor = 'none';
      }
      if (cursorType == 1) {
        sysCursor = 'crosshair';
      }
      if (cursorType == 2) {
        sysCursor = 'col-resize';
      }
      if (cursorType == 3) {
        sysCursor = 'row-resize';
      }
      if (cursorType == 4) {
        sysCursor = 'nwse-resize';
      }
      if (cursorType == 5) {
        sysCursor = 'text';
      }
      if (cursorType == 6) {
        sysCursor = 'pointer';
      }
      c.style.cursor = sysCursor;
    } else {
      if (options.drawCursor) {
        options.drawCursor(ctx, cursorType, mouseX, mouseY);
      }
    }
    ctx.restore();
  }

  var doResize = function() {
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    document.querySelector('body').style.zoom = 1;
    dpr = window.devicePixelRatio || 1;
    systemDPR = dpr;
    if (!isFirefox) {
      if (document.querySelector('body').style.zoom) {
        var zoomShift = Math.floor(dpr);
        document.querySelector('body').style.zoom = `${1 / window.devicePixelRatio * 100}%`;
        dpr = 1; //dpr * (1 / zoomShift);
      }
    }
    pixZoomFactor = Math.max(1, Math.floor(systemDPR));
    if (options.customPixZoomFactor != 0) {
      pixZoomFactor = options.customPixZoomFactor;
    }
    
    var c = document.getElementById('appstyle_canvas');
    var ctx = c.getContext('2d', { alpha: false });
    var w = Math.floor((window.innerWidth*systemDPR/pixZoomFactor) );
    var h = Math.floor((window.innerHeight*systemDPR/pixZoomFactor) );
    if (c) {
      c.width = w;
      c.height = h;
    }
    var clipper = document.getElementById('appstyle_clipper');
    if (clipper) {
      clipper.style.width = ((w*pixZoomFactor/dpr) - 4) + 'px';
      clipper.style.height = ((h*pixZoomFactor/dpr) - 4) + 'px';
    }
    if (c) {
      c.style.width = (w*pixZoomFactor/dpr) + 'px';
      c.style.height = (h*pixZoomFactor/dpr) + 'px';
    }


    for (var i=0; i < windowList.length; i++) {
      var win = windowList[i];
      if (typeof win.private != "undefined") {
        
        invalidate(win);
        win.private.cx = Math.floor(Math.min(c.width - 80*options.uiScaleFactor, Math.max(0, win.x)));
        win.private.cy = Math.floor(Math.min(c.height - 30*options.uiScaleFactor, Math.max(0, win.y)));
        focusWidget = getWidgetReference(win, -1);
        processWindowMetrics(win);
        triggerEvent(win, {type: 'resize'});
      }
    }
    updateCanvas(c);
  }
  
  var bringToTopOnly = function(wid, force) {
    if ((wid >= 0) && (windowList[wid])) {
      var neverRaise = windowList[wid].neverRaise;
      if (typeof neverRaise == "undefined") {
        neverRaise = false;
      }
      if (force || (!neverRaise)) {
        windowList[wid].z = 1000;
      }
    }
  }

  var activateWindow = function(wid, force) {
    var forceAct = force || false;
    var needFocus = ((focusWid != wid) || (!windowList[wid]?.private?.active));
    if (forceAct || needFocus) {
      if ((focusWid != -1)
      && (typeof windowList[focusWid] != "undefined")) {
        windowList[focusWid].private.active = false;
        invalidate(focusWid);
        triggerEvent(windowList[focusWid], {type: 'blur'});
      }
      focusWid = -1;
      if ((wid >= 0) && (windowList[wid])) {
        focusWid = wid;
        windowList[wid].private.active = true;
        if (needFocus) {
          triggerEvent(windowList[focusWid], {type: 'focus'});
        }
        invalidate(focusWid);
      }
    }
  }

  var bringToTop = function(wid, force) {
    var forceTop = force || false;
    var needFocus = ((focusWid != wid) || (!windowList[wid]?.private?.active));
    if (forceTop || needFocus) {
      bringToTopOnly(wid);
      activateWindow(wid, force);
    }
  }

  var nwid = 0;
  
  function ev_mouseleave(ev) {
    internalState.boundsHideMouse = true;
  }
  function ev_mouseenter(ev) {
    internalState.boundsHideMouse = false;
  }

  function ev_mousedown(ev) {
    var isRightMB;
    if (ev.changedTouches) {
      isRightMB = false;
      inTouchEvent = true;
    } else {
      if ("which" in ev)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
        isRightMB = ev.which == 3; 
      else if ("button" in ev)  // IE, Opera 
        isRightMB = ev.button == 2; 
    }
    ev_mousemove(ev);
    if (!isRightMB) {

      if (internalState.mouseOverWid >= 0) {
        bringToTop(internalState.mouseOverWid);
        var win = windowList[internalState.mouseOverWid];
        invalidate(win);
        if (win.private.mouseElement.class == 'window') {
          win.private.focusWidget = getWidgetReference(win, -1);
          win.private.focusWidgetWait = false;
        }
        var widg = win.private.widgets[win.private.mouseElement.currentIndex];
        if (widg && canWidgetFocus(win, widg)) {
          win.private.focusWidget = win.private.mouseElement;
          win.private.focusWidgetWait = true;
        } else {
          if (win.private.mouseElement.class != '') {
            dragdrop.wid = internalState.mouseOverWid;
            document.body.classList.add('dragging');
            windowList[internalState.mouseOverWid].private.dragdrop = true;
            dragdrop.source = win.private.mouseElement;
            dragdrop.ox = win.private.cx;
            dragdrop.oy = win.private.cy;
            dragdrop.ow = win.private.gw;
            dragdrop.oh = win.private.gh;
            dragdrop.ex = -100;
            dragdrop.ey = -100;
            dragdrop.ec = '???????';
            var widg = win.private.widgets;
            if (typeof widg[win.private.mouseElement.currentIndex] != "undefined") {
              var widget = widg[win.private.mouseElement.currentIndex];
              var pos = getWidgetPos(win, widget, true);
              var wc = widgetClasses[widget.class];
              if (wc && wc.inspectorText) {
                dragdrop.ec = wc.inspectorText(win, widget);
              }
              dragdrop.ex = pos.x;
              dragdrop.ey = pos.y;
            }
            dragdrop.x = mouseX;
            dragdrop.y = mouseY;
          }
        }
        var mpos = getLocalPos(windowList[internalState.mouseOverWid], mouseX, mouseY);
        if ((mpos.y >= 0) && (mpos.x >= 0)
        && (mpos.x < windowList[internalState.mouseOverWid].private.gw)
        && (mpos.y < windowList[internalState.mouseOverWid].private.gh)
        ) { // only pass content events to handler
          mouseCaptureWid = internalState.mouseOverWid;
          triggerEvent(windowList[internalState.mouseOverWid], {type: 'mouseDown', target: dragdrop.source});
        } else {
          triggerEvent(windowList[internalState.mouseOverWid], {type: 'dragFrame', target: dragdrop.source});
        }
        invalidate(win);
      } else {
        if (focusWid >= 0) {
          bringToTop(-1, true);
        }
      }
    }
    var c = document.getElementById('appstyle_canvas');
    if ((!isRightMB) && ev.pointerId && c.setPointerCapture) {
      c.setPointerCapture(ev.pointerId);
    }
    updateCanvas(c);
    inTouchEvent = false;
  }
  
  var toggleFullScreen = function() {
    var c = document.body;
    if (!superFullScreen) {
      if (c.webkitRequestFullScreen) {
        superFullScreen = true;
        c.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT); //Chrome
      } else if (c.mozRequestFullScreen) {
        superFullScreen = true;
        c.mozRequestFullScreen(); //Firefox
      }
    } else {
      //now i want to cancel fullscreen
      if (document.webkitCancelFullScreen) {
        superFullScreen = false;
        document.webkitCancelFullScreen(); //Chrome
      } else if (document.mozCancelFullScreen) {
        superFullScreen = false;
        document.mozCancelFullScreen(); //Firefox
      }
    }
  }
  
  function ev_dblclick(ev) {
    if (internalState.mouseOverWid >= 0) {
      var r = triggerEvent(windowList[internalState.mouseOverWid], {type: 'dblClick', target: windowList[internalState.mouseOverWid].private.mouseTarget}, ev);
      if (r) {
        if (windowList[internalState.mouseOverWid].private.mouseTarget.class == 'titleBar') {
          var win = windowList[internalState.mouseOverWid];
          if (win.titleBar && (!win.private.collapsed)) {
            win.private.collapsed = true;
          } else {
            win.private.collapsed = false;
          }
          processWindowMetrics(win);
        }
      } // end default behavior
      invalidate(internalState.mouseOverWid);
    } else {
      // could put event handeler here, but we need a global event hook!
      toggleFullScreen();
    }
  }
  
  var closeWindow = function(win_or_wid) {
    var win;
    if (typeof win_or_wid == "object") {
      win = win_or_wid;
    } else {
      win = windowList[win_or_wid];
    }
    var wid = win.private.wid;
    win.class = "appstyle.closed";
    win.storage = {};
    win.title = null;
    win.widgets = null;
    win.paint = null;
    win.event = null;
    win.private.closed = true;
    win.private.active = false;
    invalidate(wid);
    if (focusWidget.wid == wid) {
      var mto = document.getElementById('appstyle_text_overlay');
      if (mto) {
        mto.style.top = '-1000px';
      }
      focusWidget = getWidgetReference(false, -1);
    }
    if (internalState.mouseOverWid == wid) {
      internalState.mouseOverWid = -1;
    }
    if (focusWid == wid) {
      focusWid = -1;
    }
  }

  function ev_mouseup(ev) {
    var isRightMB;
    ev_mousemove(ev);
    if ("which" in ev)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
      isRightMB = ev.which == 3; 
    else if ("button" in ev)  // IE, Opera 
      isRightMB = ev.button == 2; 

    if (!isRightMB) {
      var c = document.getElementById('appstyle_canvas');
      if (c.releasePointerCapture && ev.pointerId) {
        c.releasePointerCapture(ev.pointerId);
      }
      if ((dragdrop.wid >= 0) && (typeof windowList[dragdrop.wid] == "undefined")) {
        dragdrop.wid = -1;
      }
      if (dragdrop.wid >= 0) {

        if (typeof windowList[dragdrop.wid].private.dragMemoX != "undefined") {
          delete windowList[dragdrop.wid].private.dragMemoX;
        }
        if (typeof windowList[dragdrop.wid].private.dragMemoY != "undefined") {
          delete windowList[dragdrop.wid].private.dragMemoY;
        }

        var contentArea = false;

        if (internalState.mouseOverWid >= 0) {
          var mpos = getLocalPos(windowList[internalState.mouseOverWid], mouseX, mouseY);
          contentArea = ((mpos.y >= 0) && (mpos.x >= 0)
          && (mpos.x < windowList[internalState.mouseOverWid].private.gw)
          && (mpos.y < windowList[internalState.mouseOverWid].private.gh)
          );
        }

        if (mouseCaptureWid >= 0) {
          triggerEvent(windowList[mouseCaptureWid], {type: 'mouseUp', target: windowList[mouseCaptureWid].private.mouseTarget, captured: true}, ev);
        }

        if (internalState.mouseOverWid >= 0) {
          if ((dragdrop.source.id) && (dragdrop.source.id != '')
          && (dragdrop.source.id == windowList[internalState.mouseOverWid].private.mouseTarget.id)
          && (dragdrop.wid == internalState.mouseOverWid)) {
            triggerEvent(windowList[dragdrop.wid], {type: 'click', target: windowList[internalState.mouseOverWid].private.mouseTarget}, ev);
          }
        }

        if (internalState.mouseOverWid >= 0) {
          if (!contentArea) {
            if (dragdrop.wid == internalState.mouseOverWid) {
              triggerEvent(windowList[internalState.mouseOverWid], {type: 'dropFrame', target: windowList[internalState.mouseOverWid].private.mouseTarget}, ev);
            } else {
              triggerEvent(windowList[internalState.mouseOverWid], {type: 'dropOnFrame',
                source: dragdrop.source,
                target: windowList[internalState.mouseOverWid].private.mouseTarget
              }, ev);
            }
          } else {
            triggerEvent(windowList[internalState.mouseOverWid], {type: 'drop',
              source: dragdrop.source,
              target: windowList[internalState.mouseOverWid].private.mouseTarget
            }, ev);
          }
        }
      
        if (dragdrop.source.class == 'closeBtn') {
          if (windowList[dragdrop.wid].private.mouseTarget.class == 'closeBtn') {
            if (triggerEvent(windowList[dragdrop.wid], {type: 'close'}, ev)) {
              closeWindow(dragdrop.wid);
            }
          }
        }
        if (windowList[dragdrop.wid] && windowList[dragdrop.wid].private) {
          windowList[dragdrop.wid].private.dragdrop = false;
        }
        var mcwid = mouseCaptureWid;
        var ddwid = dragdrop.wid;
        mouseCaptureWid = -1;
        dragdrop.wid = -1;
        document.body.classList.remove('dragging');
        invalidate(mcwid);
        invalidate(ddwid);
      }
    }
  }

  function ev_mousemove(ev) {
    var c = document.getElementById('appstyle_canvas');
    var x, y;
    
    if (ev.changedTouches) {
      x = ev.changedTouches[0].pageX;
      y = ev.changedTouches[0].pageY;
      inTouchEvent = true;
    } else {
      if (ev.layerX || ev.layerX == 0) {
        x = ev.layerX;
        y = ev.layerY;
      } else if (ev.offsetX || ev.offsetX == 0) {
        x = ev.offsetX;
        y = ev.offsetY;
      }
      if (ev.target != c) {
        x = ev.pageX;
        y = ev.pageY;
        internalState.inputHideMouse = true;
      } else {
        internalState.inputHideMouse = false;
      }
    }
    if ((x < 0) || (y < 0)) {
      internalState.boundsHideMouse = true;
    } else {
      internalState.boundsHideMouse = false;
    }

    mouseX = Math.floor(x / pixZoomFactor * systemDPR);
    mouseY = Math.floor(y / pixZoomFactor * systemDPR);
    
    var ddwid = dragdrop.wid;
    var needinv = false;

    if ((dragdrop.wid >= 0) && (dragdrop.source.class == 'titleBar')) {
      var win = windowList[dragdrop.wid];
      var c = document.getElementById('appstyle_canvas');
      win.x = dragdrop.ox + mouseX - dragdrop.x;
      win.y = dragdrop.oy + mouseY - dragdrop.y;
      var hMargin = 80*options.uiScaleFactor;
      win.private.cx = Math.floor(Math.min(c.width - hMargin, Math.max(Math.min(hMargin, hMargin-win.private.gw), win.x)));
      win.private.cy = Math.floor(Math.min(c.height - 30*options.uiScaleFactor, Math.max(0, win.y)));
    }

    if (dragdrop.source && (dragdrop.wid >= 0)) {
      var win = windowList[dragdrop.wid];
      var wc = widgetClasses[dragdrop.source.class];
      if (wc && wc.dragging && win && win.private) {
        wc.dragging(win, getWidgetById(win, dragdrop.source.id));
      }
    }
    
    if ((dragdrop.wid >= 0) && ((dragdrop.source.class == 'hSizer') || (dragdrop.source.class == 'xSizer'))) {
      var win = windowList[dragdrop.wid];
      var c = document.getElementById('appstyle_canvas');
      var hMargin = 80*options.uiScaleFactor;

      if (win.pixel) {
        var minWidth = hMargin;
        var dragOffset = (mouseX - dragdrop.x);
        if (win.private.cx < 0) {
          minWidth = hMargin - win.private.cx;
        }
        
        var maxWidth = c.width - 10*options.uiScaleFactor;

        win.w = Math.floor(Math.min(maxWidth, Math.max(minWidth, dragdrop.ow + dragOffset)));
        win.private.cw = win.w;
        win.private.gw = win.w;
      } else {

        var extra = 0;
        if (win.private.cx < 0) {
          extra = 0 - win.private.cx;
        }
        var spos = getCharFromPos(win, hMargin + extra, 0);
        var minWidth = spos.x;

        var tw = Math.max(1, dragdrop.ow + (mouseX - dragdrop.x));
        var th = win.private.h;
        var pos = getCharFromPos(win, tw, th);
        var maxpos = getCharFromPos(win, c.width - 10*options.uiScaleFactor, 0);
        var tw = Math.min(maxpos.x, pos.x);
        win.w = Math.max(minWidth, tw);
        win.private.cw = win.w;
        win.private.gw = win.w;
      }
      needinv = true;
    }

    if ((dragdrop.wid >= 0) && ((dragdrop.source.class == 'vSizer') ||
    (dragdrop.source.class == 'xSizer'))) {
      var win = windowList[dragdrop.wid];
      var c = document.getElementById('appstyle_canvas');

      if (win.pixel) {
        win.h = Math.max(0, dragdrop.oh + (mouseY - dragdrop.y));
        win.private.ch = Math.floor(Math.min(c.height - 10*options.uiScaleFactor - (win.private.titleBarHeight || 0), Math.max(1, win.h)));
      } else {
        var th = Math.max(1, dragdrop.oh + (mouseY - dragdrop.y));
        var tw = win.private.w;
        var pos = getCharFromPos(win, tw, th);
        var maxpos = getCharFromPos(win, 0, c.height - 10*options.uiScaleFactor - (win.private.titleBarHeight || 0));
        var th = Math.min(maxpos.y, pos.y);
        win.h = Math.max(0, th);
        win.private.ch = th;
      }
      needinv = true;
    }
    
    if (needinv) {
      // onResize
      var r = triggerEvent(windowList[dragdrop.wid], {type:'resize'}, ev);
      if (r) {
//        invalidate(ddwid);
        invalidate(dragdrop.wid);
      }
    }
    if (inTouchEvent) {
      updateCanvas(c);
    }
  }
  
  function ev_keydown(e) {
    if ((focusWid != -1)
    && windowList[focusWid]) {
      triggerEvent(windowList[focusWid], {
        type: 'keyDown', which: e.which, code: e.code,
        charCode: e.charCode, keyCode: e.keyCode,
        shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey
      }, e);
    }
  }

  function ev_keyup(e) {
    if (focusWidget.wid != -1) {
      ev_textchange();
    }
    if ((focusWid != -1)
    && windowList[focusWid]) {
      triggerEvent(windowList[focusWid], {
        type: 'keyUp', which: e.which, code: e.code,
        charCode: e.charCode, keyCode: e.keyCode,
        shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey
      }, e);
      invalidate(focusWid);
    }
  }

  function ev_keypress(e) {
    var ch = String.fromCharCode(e.which);

    if ((focusWid != -1)
    && windowList[focusWid]) {
      triggerEvent(windowList[focusWid], {
        type: 'keyPress', char: String.fromCharCode(e.which),
        which: e.which, code: e.code,
        charCode: e.charCode, keyCode: e.keyCode,
        shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey, metaKey: e.metaKey
      }, e);
      invalidate(focusWid);
    }
  }

  /* ##### textInput Widget Functions ########################## */
  
  function ev_textfocus() {
    internalState.inputHideMouse = true;
    if (focusWidget.class != '') {
      focusWidgetLoading = false;
    }
  }

  function ev_textblur() {
    if ((focusWidget.class != '') && (!focusWidgetLoading)) {
      if ((focusWidget.wid != -1) && (focusWidget.class == 'textInput')) {
        var myInput = document.querySelector('#appstyle_textinput');
        if (myInput) {
          windowList[focusWidget.wid].storage[focusWidgetStorage].value = myInput.value;
        }
      }
      if (focusWidget.wid != -1) {
        var mto = document.getElementById('appstyle_text_overlay');
        if (mto) {
          mto.style.top = '-1000px';
        }
        windowList[focusWidget.wid].private.focusWidget = getWidgetReference(windowList[focusWidget.wid], -1);
        invalidate(focusWidget.wid);
      }
      focusWidget = getWidgetReference(false, -1);
    }
  }
  
  function ev_textchange() {
    if ((focusWidget.wid != -1) && (focusWidget.class == 'textInput')) {
      if (windowList[focusWidget.wid]) {
        if (typeof windowList[focusWidget.wid].storage != "undefined") {
          var myInput = document.querySelector('#appstyle_textinput');
          if (myInput) {
            windowList[focusWidget.wid].storage[focusWidgetStorage].value = myInput.value;
          }
        }
        invalidate(focusWidget.wid);
      }
    }
  }

  function drawTextInput(win, ctx, x, y, w, h, storage, id) {
    var myt = document.getElementById('appstyle_textinput');
    var ids = id;
    if ((typeof ids == "undefined") || (ids == '')) {
      ids = storage;
    }
    var mh = ((h-2) * pixZoomFactor);
    if (win.private.active && ids && (win.private.focusWidget.id == ids) && (!win.private.collapsed)) {
      drawTime = false;
      if ((focusWidget.wid != win.private.wid) || (focusWidget.id != ids)) {
        // initialize the new input
        if (myt) {
          myt.value = win.storage[storage].value;
        }
        drawTime = true;
        focusWidgetLoading = true;
        focusWidget = win.private.focusWidget;
        focusWidgetStorage = storage;
        document.body.classList.remove('textInputHidden');
        if (myt) {
          myt.style.visibility = 'visible';
          myt.style.display = 'block';
        }
      }
      if (drawTime) {
        if (myt) {
          myt.style.visibility = 'visible';
        }
        var mto = document.getElementById('appstyle_text_overlay');
        mto.style.left = Math.floor(((2 + windowList[win.private.wid].private.cx + x))*pixZoomFactor/dpr) + 'px';
        mto.style.top = (Math.floor(((2 + windowList[win.private.wid].private.cy + win.private.titleBarHeight -
          4/pixZoomFactor + y))*pixZoomFactor/dpr) + 2-(dpr*pixZoomFactor/2)) + 'px';
        mto.style.display = 'block';

        var mw = w * pixZoomFactor/dpr - 8;
        if (x + w > (win.private.w)) {
          mw = ((win.private.w - x) * pixZoomFactor/dpr) - 8;
        }
        if ((mw > 2) && ((y + h) < win.private.gh)) {
          if (myt) {
            myt.style.width = (mw-2) + 'px';
            myt.style.height = (((mh-8)/dpr)+(2/(dpr*pixZoomFactor))*2) + 'px';
            myt.style.fontSize = (((mh-12)/dpr)+(3/(dpr*pixZoomFactor))*3) + 'px';
            myt.style.visibility = 'visible';
            myt.style.display = 'block';
          }
          if (win.private.active && (win.private.focusWidget.id == ids) &&
          (win.private.focusWidget.id != '')) {
            ctx.beginPath();
            ctx.fillStyle = theme.colorActiveTextInputBack;
            ctx.rect(x, y, w, h);
            ctx.fill();
          }
        } else {
          if (myt) {
            myt.style.visibility = 'hidden';
          }
          document.body.classList.add('textInputHidden');
          ctx.beginPath();
          ctx.fillStyle = theme.colorInactiveTextInputBack;
          if (win.private.focusWidget.id == ids) {
            ctx.fillStyle = theme.colorActiveTextInputBack;
          }
          ctx.rect(x, y, w, h);
          ctx.fill();
        }
      } else {
        var mto = document.getElementById('appstyle_text_overlay');
        if ( (mto.offsetLeft != (windowList[win.private.wid].private.cx + x))
        || (mto.offsetTop != (windowList[win.private.wid].private.cy + win.private.titleBarHeight + y))
        ) {
          mto.style.left = Math.floor((2 + windowList[win.private.wid].private.cx + x)*pixZoomFactor/dpr) + 'px';
          mto.style.top = (Math.floor((2 + windowList[win.private.wid].private.cy + win.private.titleBarHeight
            - 4/pixZoomFactor + y)*pixZoomFactor/dpr) + 2 -
            dpr*pixZoomFactor/2) + 'px';
          var mw = w * pixZoomFactor/dpr - 8;
          if (x + w > (win.private.w)) {
            mw = ((win.private.w - x) * pixZoomFactor/dpr) - 8;
          }
          if (y + h < win.private.gh) {
            document.body.classList.remove('textInputHidden');
            if (myt) {
              myt.style.width = (mw-2) + 'px';
              myt.style.height = (((mh-8)/dpr)+(2/(dpr*pixZoomFactor))*2) + 'px';
              myt.style.fontSize = (((mh-12)/dpr)+(3/(dpr*pixZoomFactor))*3) + 'px';
              myt.style.visibility = 'visible';
              myt.style.display = 'block';
            }
          } else {
            myt.style.visibility = 'hidden';
            document.body.classList.add('textInputHidden');
          }
          if ((focusWidget.wid == win.private.wid) && (win.private.focusWidget.id == ids)) {
            ctx.beginPath();
            ctx.fillStyle = theme.colorActiveTextInputBack;
            ctx.rect(x, y, w, h);
            ctx.fill();
          }
        }
      } // not draw time
      // if mousedown, what happens here?
      if (win.private.focusWidgetWait) {
        win.private.focusWidgetWait = false;
        lastFocusWid = win.private.wid;
        lastFocusId = ids;
        setTimeout(function() {
          var myt = document.getElementById('appstyle_textinput');
          if (myt) {
            myt.focus();
            myt.select();
          }
        }, 1);
        if (mouseCaptureWid != -1) {
          triggerEvent(windowList[mouseCaptureWid], {type:'mouseUp',
            target: windowList[mouseCaptureWid].private.mouseTarget
          });
          if (win.private.focusWidget.id != '') {
            triggerEvent(win, {type:'click',
            target: win.private.focusWidget});
          }
          mouseCaptureWid = -1;
        }
      }
    } else { // everything above this was current active input
      if ((focusWidget.wid == win.private.wid) && (focusWidget.id == ids)) {
        var mto = document.getElementById('appstyle_text_overlay');
        if (mto) {
          mto.style.top = '-1000px';
        }
      }
      ctx.fillStyle = theme.colorInactiveTextInputBack;
      ctx.strokeStyle = theme.colorInactiveTextInputEdge;
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.fill();
      ctx.stroke();
      ctx.font = ((mh*0.8)/pixZoomFactor) + 'px ' + windowFontName;
      ctx.fillStyle = theme.colorInactiveTextInputFore;
      ctx.beginPath();
      ctx.fillText(win.storage[storage].value,
        x + 4*dpr/pixZoomFactor,
        y + ((mh * 0.2)/pixZoomFactor),
        w - 4*dpr/pixZoomFactor
      );
    }
  }
  
  var textInput = function(win, storage, defaultValue, props) {
    var dv = defaultValue;
    if (typeof dv == "undefined") {
      dv = '';
    }
    if ((typeof win.storage[storage] == "undefined")
    || (typeof win.storage[storage].value == "undefined")) {
      win.storage[storage] = {value: dv};
    }
    var o = {
      class: "textInput",
      id: storage,
      storage: storage
    }
    addPropsToObject(o, win.private.defaultProps);
    addPropsToObject(o, props);
    if (typeof o.h == "undefined") {
      o.h = 1;
    }
    win.private.widgets.push(o);
  }

  function widgetPaintTextInput(win, ctx, widg, ofs) {
    stor = widg.id;
    drawTextInput(win, ctx, ofs.x, ofs.y, ofs.w, ofs.h, stor);
  }
  
  /* ##### end textInput Widget Functions ############### */


  // Options
  const fpsDecimalPlaces    = 2;
  const fpsUpdateEachSecond = 1;

  // Cache values
  const fpsDecimalPlacesRatio = Math.pow(10, fpsDecimalPlaces);
  let fpsTimeMeasurements     = [];
  
  function animationFrame(ev) {
    if (needDoResize) {
      needDoResize = false;
      doResize();
    }
    fpsTimeMeasurements.push(performance.now());

    const msPassed = fpsTimeMeasurements[fpsTimeMeasurements.length - 1] - fpsTimeMeasurements[0];

    if (msPassed >= fpsUpdateEachSecond * 1000) {
      internalState.fps = Math.max(1,
        Math.round(fpsTimeMeasurements.length / msPassed * 1000 * fpsDecimalPlacesRatio) / fpsDecimalPlacesRatio
      );
      fpsTimeMeasurements = [];
    }

    var c = document.getElementById('appstyle_canvas');
    updateCanvas(c);
    window.requestAnimationFrame(animationFrame)    
  }
  
  function addPropsToObject(o, props) {
    if (typeof props != "undefined") {
      for (const key in props) {
        if (props.hasOwnProperty(key)) {
          o[key] = props[key];
        }
      }
    }
  }

  var setWidgetDefaults = function(win, props) {
    var o = {}
    addPropsToObject(o, props);
    win.private.defaultProps = props;
  }
  
  var custom = function(win, className, props) {
    var o = {
      id: "",
      class: className
    }
    addPropsToObject(o, win.private.defaultProps);
    addPropsToObject(o, props);
    win.private.widgets.push(o);
  }

  function widgetPaintText(win, ctx, widg, ofs) {
    var align = widg.textAlign || 'left';
    switch (align) {
      case 'left': drawText(win, ctx, ofs.x, ofs.y, ofs.w, ofs.h, widg.caption, widg.font, widg.color); break;
      case 'center': drawTextCentered(win, ctx, ofs.x, ofs.y, ofs.w, ofs.h, widg.caption, widg.font, widg.color); break;
    }
  }

  var text = function(win, caption, props) {
    var o = {
      id: "",
      class: "text",
      caption: caption
    }
    addPropsToObject(o, win.private.defaultProps);
    addPropsToObject(o, props);
    if (typeof o.h == "undefined") {
      o.h = 1;
    }
    if (typeof o.graven == "undefined") {
      o.graven = true;
    }
    win.private.widgets.push(o);
  }

  var textLn = function(win, caption, props) {
    var o = {
      id: "",
      class: "text",
      caption: caption
    }
    addPropsToObject(o, win.private.defaultProps);
    addPropsToObject(o, props);
    if (typeof o.h == "undefined") {
      o.h = 1;
    }
    if (typeof o.graven == "undefined") {
      o.graven = true;
    }
    win.private.widgets.push(o);
    win.private.defaultProps.y = o.y + 1;
    win.private.defaultProps.x = 0;
  }

  var drawBackground = function(win, ctx) {
    // overfill the background to verify that the clipping rectangle is good
    if (win.private.active) {
      ctx.fillStyle = theme.colorActiveBack;
    } else {
      ctx.fillStyle = theme.colorInactiveBack;
    }
    ctx.beginPath();
    ctx.rect(0 - 10, 0 - 10, win.private.gw + 20, win.private.gh + 20);
    ctx.fill();
    if (win.charGrid) {
      if (win.private.active) {
        ctx.strokeStyle = theme.colorActiveCharGrid;
      } else {
        ctx.strokeStyle = theme.colorInactiveCharGrid;
      }
      var xo = Math.floor(win.private.charOffsetX * win.private.charWidth);
      var x = 0;
      while (xo + x*win.private.charWidth < win.private.gw) {
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xo + x*win.private.charWidth - 0, 0);
        ctx.lineTo(xo + x*win.private.charWidth - 0, win.private.gh);
        ctx.stroke();
        x++;
      }
      var yo = Math.floor(win.private.charOffsetY * win.private.charHeight);
      var y = 0;
      while (yo + y*win.private.charHeight < win.private.gh) {
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, yo + y*win.private.charHeight - 0);
        ctx.lineTo(win.private.gw, yo + y*win.private.charHeight - 0);
        ctx.stroke();
        y++;
      }
    }
  }
  
  var drawText = function(win, ctx, x, y, w, h, caption, font, color) {
    var fname = windowFontName;
    if (font) {
      fname = font;
    }
    ctx.font = (h * 0.76) + 'px ' + fname;
    if (typeof color == "undefined") {
      if (win.private.active) {
        ctx.fillStyle = theme.colorActiveTextFore;
      } else {
        ctx.fillStyle = theme.colorInactiveTextFore;
      }
    } else {
      ctx.fillStyle = color;
    }
    ctx.beginPath();
    ctx.fillText(caption,
      x,
      y + (0.12 * h),
      w
    );
  }

  var measureText = function(...args) { // [ctx], h, caption, font
    var ctx = measuringContext;
    var argoffset = 0;
    if (typeof args[0] == 'Object') {
      ctx = args[0];
      argoffset++;
    }
    var h = args[argoffset];
    var caption = args[argoffset+1];
    var font = args[argoffset+2];
    
    var fname = windowFontName;
    if (font) {
      fname = font;
    }
    ctx.font = (h * 0.76) + 'px ' + fname;
    return ctx.measureText(caption);
  }

  var drawTextCentered = function(win, ctx, x, y, w, h, caption, font, color) {
    var fname = windowFontName;
    if (font) {
      fname = font;
    }
    ctx.font = (h * 0.76) + 'px ' + fname;
    if (typeof color == "undefined") {
      if (win.private.active) {
        ctx.fillStyle = theme.colorActiveTextFore;
      } else {
        ctx.fillStyle = theme.colorInactiveTextFore;
      }
    } else {
      ctx.fillStyle = color;
    }
    ctx.beginPath();
    var text = ctx.measureText(caption);
    var textwidth = text.width;
    if (textwidth > w) {
      textwidth = w;
    }
    ctx.fillText(caption,
      x + ((w - textwidth) / 2),
      y + (0.12 * h),
      w
    );
  }
  
  function drawFlatOutline(ctx, ofs, pad, thick, color) {
    ctx.beginPath();
    ctx.moveTo(ofs.x-pad - thick,               ofs.y-pad+ofs.h+pad*2 + thick); // bottom left corner outer
    ctx.lineTo(ofs.x-pad - thick,               ofs.y-pad - thick); // left edge outer
    ctx.lineTo(ofs.x-pad + ofs.w+pad*2 + thick, ofs.y-pad - thick); // top edge outer
    ctx.lineTo(ofs.x-pad + ofs.w+pad*2 + thick, ofs.y-pad+ofs.h+pad*2 + thick); // right edge outer
    ctx.lineTo(ofs.x-pad - thick,               ofs.y-pad+ofs.h+pad*2 + thick); // bottom edge outer
    ctx.lineTo(ofs.x-pad,                       ofs.y-pad+ofs.h+pad*2); // left inner corner
    ctx.lineTo(ofs.x-pad + ofs.w+pad*2,         ofs.y-pad+ofs.h+pad*2); // bottom inner
    ctx.lineTo(ofs.x-pad + ofs.w+pad*2,         ofs.y-pad); // right inner
    ctx.lineTo(ofs.x-pad,                       ofs.y-pad); // top inner
    ctx.lineTo(ofs.x-pad,                       ofs.y-pad+ofs.h+pad*2); // left inner
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  
  function drawBevel(ctx, ofs, pad, thick, depth, raised, tint) {
    if (typeof tint == "undefined") {
      tint = theme.bevelTint;
    }
    ctx.beginPath();
    ctx.moveTo(ofs.x-pad - thick,           ofs.y-pad + ofs.h +pad*2 + thick);
    ctx.lineTo(ofs.x-pad - thick,           ofs.y-pad - thick); // left edge outer
    ctx.lineTo(ofs.x-pad + ofs.w+pad*2 + thick, ofs.y-pad - thick); // top
    ctx.lineTo(ofs.x-pad + ofs.w+pad*2,         ofs.y-pad); // top right
    ctx.lineTo(ofs.x-pad,                   ofs.y-pad); // top inner
    ctx.lineTo(ofs.x-pad,                   ofs.y-pad + ofs.h+pad*2 + thick - 1 );
    ctx.closePath();

    var xpd;
    
    if (raised) {
      xpd = (depth + 4) * 16;
    } else {
      xpd = Math.max(0, depth - 2) * 16;
    }
    ctx.fillStyle = 'rgb(' + (xpd*tint[0]) + ',' + (xpd*tint[1]) + ',' + (xpd*tint[2]) + ')';

    ctx.fill();

    if (raised) {
      xpd = Math.max(0, depth - 2) * 16;
    } else {
      xpd = (depth + 4) * 16;
    }

    ctx.fillStyle = 'rgb(' + (xpd*tint[0]) + ',' + (xpd*tint[1]) + ',' + (xpd*tint[2]) + ')';

    ctx.beginPath();
    ctx.moveTo(ofs.x-pad - thick + 1,                   ofs.y-pad+ofs.h+pad*2 + thick);
    ctx.lineTo(ofs.x-pad + ofs.w+pad*2 + thick, ofs.y-pad+ofs.h+pad*2 + thick);
    ctx.lineTo(ofs.x-pad + ofs.w+pad*2 + thick, ofs.y-pad-thick + 1);
    ctx.lineTo(ofs.x-pad + ofs.w+pad*2,         ofs.y-pad + 1);
    ctx.lineTo(ofs.x-pad + ofs.w+pad*2,         ofs.y-pad+ofs.h+pad*2);
    ctx.lineTo(ofs.x-pad + 1,                   ofs.y-pad+ofs.h+pad*2);
    ctx.closePath();
    ctx.fill();
  }

  var drawWidgets = function(win, ctx, parentWidgetId) {
    var pwi = -1;
    if (typeof parentWidgetId != "undefined") {
      if (parentWidgetId != '') {
        pwi = getWidgetIndexById(win, parentWidgetId);
      }
    }
    var stor = '';
    var parents = {};
    if (win.private.widgets) {
      for (var r=0; r < win.private.widgets.length; r++) {
        var widg = win.private.widgets[r];
        var wpi = -1;
        if ((typeof widg.parentId != "undefined")
        && (widg.parentId != '')) {
          if (typeof parents[widg.parentId] != "undefined") {
            wpi = parents[widg.parentId]
          } else {
            wpi = getWidgetIndexById(win, widg.parentId);
            if (wpi == -1) {
              wpi = -2;
            }
            parents[widg.parentId] = wpi;
          }
        }
        if (pwi == wpi) {
          var ofs = getWidgetPos(win, widg, true);
          ofs.x = Math.floor(ofs.x) + 0.5;
          ofs.y = Math.floor(ofs.y) + 0.5;
          ofs.h = Math.floor(ofs.h);
          ofs.w = Math.floor(ofs.w);
          var wc = widgetClasses[widg.class];
          if (wc && wc.paint) {
            wc.paint(win, ctx, widg, ofs);
          }
        }
      }
    }
  }

  function getEnvironment() {
    var env = JSON.stringify(windowList);
    var wp = JSON.parse(env);
    for (var i=wp.length-1; i>=0; i--) {
      if (typeof wp[i].private != "undefined") {
        if (wp[i].private.closed) {
          wp.splice(i,1);
        }
      }
    }
    for (var i=0;i<wp.length;i++) {
      delete wp[i].private;
      if (typeof wp[i].storage != "undefined") {
        if (isEmpty(wp[i].storage)) {
          delete wp[i].storage;
        }
      }
      // class stuff
      if (typeof wp[i].class != "undefined") {
        var classData = windowClasses[wp[i].class];
        for (const key in classData) {
          if (classData.hasOwnProperty(key)) {
            if (wp[i][key] == classData[key]) {
              delete wp[i][key];
            }
          }
        }
      }
    }
    return wp;
  }
  
  function saveEnvironment(appName) {
    var name = appName || 'appstyle.json';
    window.localStorage.setItem(name, JSON.stringify(getEnvironment()));
    return true;
  }
  
  function loadEnvironment(appName) {
    var found = false;
    var name = appName || 'appstyle.json';
    var savedState = window.localStorage.getItem(name);
    if (typeof savedState != "undefined") {
      if (savedState != '') {
        savedState = JSON.parse(savedState);
        if (savedState) {
          if (savedState.length) {
            var zSort = {};
            for (var i=0; i < savedState.length; i++) {
              found = true;
              var wid = appstyle.makeWindow(savedState[i], true);
              zSort[wid] = savedState[i].z;
            }
            for (const key in zSort) {
              if (zSort.hasOwnProperty(key)) {
                if (appstyle.windowList[key]) {
                  appstyle.windowList[key].z = zSort[key];
                }
              }
            }
          }
        }
      }
    }
    needDoResize = true;
    return found;
  }
  
  function resetEnvironment() {
    windowList = [];
    return true;
  }
  
  function requestUpload(localStorageKey, callback) {
    var modal = document.getElementById('appstyle_modal');
    modal.innerHTML = '<div class="appstyle_popwindow"><input type="file" name="files[]" id="fileUpload"></div>';
    modal.style.zoom = 2 * pixZoomFactor / dpr;
    modal.addEventListener('pointerdown', dismissModal, false);
    var modalpop = document.querySelector('#appstyle_modal div');
    if (modalpop) {
      modalpop.addEventListener('pointerdown', keepModal, false);
    }
    modal.style.display = 'block';
    modalCallback = callback;
    upload_init(localStorageKey, callback);
  }
  
  function debuggerEvents(win, evt) {
    if (evt.type == 'click') {
      if (win.private.mouseTarget.id == 'resetBtn') {
        resetEnvironment();
        makeWindow({
          class: 'appstyle.debugger'
        });
        doResize();
      }
      if (win.private.mouseTarget.id == 'newBtn') {
        nwid++;
        var opts = {
          w: Math.floor((Math.random() * 20) + 6),
          h: Math.floor((Math.random() * 10) + 2),
          title: 'My Window ' + nwid,
          toolFrame: (Math.random() < 0.25),
          titleBar: (Math.random() > 0.01),
          horizontalSize: (Math.random() < 0.5),
          verticalSize: (Math.random() < 0.5),
          showGrid: (Math.random() < 0.5)
        }
        var winClass = prompt('Window Class:', '');
        if (winClass != null) {
          if (winClass != '') {
            opts.class = winClass;
          }
          // spawn a new window
          makeWindow(opts);
        }
      }
      if (win.private.mouseTarget.id == 'downBtn') {
        download('appstyle-windows.json', JSON.stringify(getEnvironment()));
      }
      if (win.private.mouseTarget.id == 'saveBtn') {
        saveEnvironment();
        alert('Saved!');
      }
      if (win.private.mouseTarget.id == 'loadBtn') {
        resetEnvironment();
        loadEnvironment();
      }
      if (win.private.mouseTarget.id == 'upBtn') {
        requestUpload('appstyle.json');
      }
    }
  }
  
  function debuggerWidgets(win) {
    // debugger
    var c = document.getElementById('appstyle_canvas');
    var dbgLine1 = 'Scale: ' + (window.devicePixelRatio || 1).toFixed(1)
    + 'x' + pixZoomFactor
    + 'x' + options.uiScaleFactor.toFixed(2)
    + ' @' + internalState.fps + 'fps';
    var dbgLine2 = c.width + 'x ' + c.height + ' / ' + window.innerWidth + ' x ' + window.innerHeight;
    text(win, dbgLine1, {x: 0, y: 0, h: 0.75, w:14});
    text(win, dbgLine2, {x: 0, y:0.75, h: 0.75, w:20});
    text(win, 'Windows: ' + windowList.length, {x: 0, y: 1.5, h: 0.75, w:20});
    appstyle.button(win, 'resetBtn', 'Reset', {x:15, y:-0.1, w:5, h: 1.20});
    appstyle.button(win, 'newBtn', 'New', {x:15, y:1, w:5, h: 1.20});
    appstyle.button(win, 'saveBtn', 'Save', {x:0, y:2.25, w:5});
    appstyle.button(win, 'downBtn', 'Down', {x:5, y:2.25, w:5});
    appstyle.button(win, 'upBtn', 'Upload', {x:10, y:2.25, w:5.5});
    appstyle.button(win, 'loadBtn', 'Load', {x:15.5, y:2.25, w:4.5});
    textLn(win, 'MouseXY: ' + (mouseX+win.private.cx+1) + ', ' +
    (mouseY+win.private.titleBarHeight+win.private.cy+1), {
      x:0, y:3.75, w: 20
    });
    if (internalState.mouseOverWid >= 0) {
      var vid = windowList[internalState.mouseOverWid].private.mouseTarget.id;
      if (typeof vid == "undefined") {
        vid = '???????';
      }
      textLn(win, 'Targ: [' + internalState.mouseOverWid + '] '
        + windowList[internalState.mouseOverWid].private.mouseTarget.class + ' (#'
        + windowList[internalState.mouseOverWid].private.mouseTarget.currentIndex + ': ' + vid + ')', {
        w: 20
      });
      var data = '???????';
      if (internalState.mouseOverWid >= 0) {
        var widglist = windowList[internalState.mouseOverWid].private.widgets;
        if (windowList[internalState.mouseOverWid].private.mouseTarget.currentIndex >= 0) {
          var widg = widglist[windowList[internalState.mouseOverWid].private.mouseTarget.currentIndex];
          if (typeof widg != "undefined") {
            // interrogate for data
            
            var wc = widgetClasses[widg.class];
            
            if (wc && wc.inspectorText) {
              data = wc.inspectorText(windowList[internalState.mouseOverWid], widg).substring(0,255);
            }

          } // found widget
        }
      }
      textLn(win, 'Targ.Data: ' + data, {w: 20});
    };
    if (dragdrop.wid >= 0) {
      var vid = dragdrop.source.id;
      if (typeof vid == "undefined") {
        vid = '???????';
      }
      textLn(win,'Drag & Drop:', {w:20});
      textLn(win,'Src: [' + dragdrop.wid + '] '
        + dragdrop.source.class + ' (#' + dragdrop.source.currentIndex
        + ': ' + vid + ')', {
        w:20
      });
      textLn(win,'Src.Data: ' + dragdrop.ec, {w:20});
      textLn(win,'Src+XY: ' + dragdrop.ex.toFixed(2) + ', '
      + dragdrop.ey.toFixed(2), {w:20});
      textLn(win,'Win.XY: ' + dragdrop.ox.toFixed(2) + ', '
      + dragdrop.oy.toFixed(2), {w:20});
      textLn(win,'Clk.XY: '+ dragdrop.x.toFixed(2) + ', '
      + dragdrop.y.toFixed(2), {w:20});
      textLn(win,'Win.WH: ' + dragdrop.ow.toFixed(2) + ', '
      + dragdrop.oh.toFixed(2), {w:20});
    }
  }
  
  function keepModal(ev) {
    ev.stopPropagation();
  }
  
  function dismissModal() {
    var modal = document.getElementById('appstyle_modal');
    modal.innerHTML = '';
    modal.style.display = 'none';
    if (modalCallback) {
      modalCallback(false);
      modalCallback = false;
    }
    return true;
  }
  
  function upload_init(FILE_KEY, callback) {
    // Key for local storage, use to save and access.

    // fire processUpload when the user uploads a file.
    document.querySelector('#fileUpload').addEventListener('change', handleFileUpload, false);

    // Setup file reading
    var fileName = '';
    var reader = new FileReader();
    reader.onload = handleFileRead;

    function handleFileUpload(event) {
        var file = event.target.files[0];
        fileName = file.name.split("\\").pop();
        reader.readAsBinaryString(file); // fires onload when done.
    }

    function handleFileRead(event) {
        try {
          window.localStorage.setItem(FILE_KEY, event.target.result);
        } catch (err) {
          bigFile = event.target.result
        }
        var t = document.getElementById('previous');
        var modal = document.getElementById('appstyle_modal');
        modal.innerHTML = '';
        modal.style.display = 'none';
        modalCallback = false;
        if (callback) {
          callback(true, fileName);
        }
    }

    function retrieveSave() {
        return localStorage.getItem(FILE_KEY)
    }
  }
  
  function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
  
  var registerWidgetClass = function(name, props) {
    widgetClasses[name] = props;
  }

  var registerWindowClass = function(name, props) {
    windowClasses[name] = props;
    if (typeof windowClasses[name].horizontalSize == "undefined") {
      windowClasses[name].horizontalSize = true;
    }
    if (typeof windowClasses[name].verticalSize == "undefined") {
      windowClasses[name].verticalSize = true;
    }
    if (typeof windowClasses[name].titleBar == "undefined") {
      windowClasses[name].titleBar = true;
    }
  }

  var init = function() {
    initialised = true;
  
    registerWidgetClass('text', {
      inspectorText: function(win, widget) {
        return widget.caption;
      },
      paint: widgetPaintText
    });
    registerWidgetClass('textInput', {
      inspectorText: function(win, widget) {
        return widget.storage;
      },
      canFocus: function(win, widget) {
        return (widget.id > '');
      },
      getMouseCursor: function(win, ctx, widget) {
        return 5;
      },
      paint: widgetPaintTextInput
    });
    registerWindowClass('appstyle.debugger', {
      y: 100, w: 20, h: 14,
      titleBar: true,
      title: 'Debugger', toolFrame: true,
      pixel: false,
      immediate: 2,
      widgets: debuggerWidgets,
      event: debuggerEvents,
      verticalSize: false
    });

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
      body, html {
        background: black;
        color: white;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-size: 12px;
      }
      #appstyle_modal {
        background: rgba(0,0,0,0.8);
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        position: fixed;
        z-index: 100;
        display: none;
      }
      #appstyle_modal div.appstyle_popwindow {
        background: #eee;
        color: #333;
        border: 0.2em solid #999;
        padding: 1em;
        max-width: 20em;
        margin: 0 auto;
        margin-top: 4em;
        overflow: hidden;
        cursor: pointer;
      }
      #appstyle_clipper {
        position: fixed;
        top: 0px;
        left: 0px;
        width: 10px;/*calc(100vw - 16px);*/
        height: 10px;/*calc(100vh - 16px);*/
        overflow: hidden;
      }
      #appstyle_focus_overlay {
        position: absolute;
        top: -1000px;
        visibility: visible;
        opacity: 0.1;
      }
      #appstyle_canvas {
        background: #333;
        cursor: none;
        image-rendering: crisp-edges;
        image-rendering: optimizeSpeed;             /* Older versions of FF          */
        image-rendering: -moz-crisp-edges;          /* FF 6.0+                       */
        image-rendering: -webkit-optimize-contrast; /* Safari                        */
        image-rendering: -o-crisp-edges;            /* OS X & Windows Opera (12.02+) */
        image-rendering: pixelated;                 /* Awesome future-browsers       */
        -ms-interpolation-mode: nearest-neighbor;   /* IE                            */

        position: fixed;
        margin: 0;
        padding: 0;
      }
      body.textInputHidden div#appstyle_text_overlay,
      body.dragging div#appstyle_text_overlay {
        pointer-events: none;
      }
      #appstyle_clipper input[type='text'] {
        background: rgba(0,0,0,0);
        color: #ccc;
      }
    `;
    document.getElementsByTagName('head')[0].appendChild(style);

    var clipper = document.createElement('div');
    clipper.id = 'appstyle_clipper';
    clipper.innerHTML = '<canvas id="appstyle_canvas" width="10" height="10" style="z-index: 1;"></canvas><div id="appstyle_focus_overlay"><input type="checkbox" tabindex="1" id="focus_last"><input type="checkbox" tabindex="2" id="focus_rest"><input type="checkbox" tabindex="3" id="focus_first"><input type="checkbox" tabindex="6" id="focus_post"><input type="checkbox" tabindex="4" id="focus_pre"></div><div id="appstyle_text_overlay" style="position: absolute; z-index: 2; top: -1000px;"><input id="appstyle_textinput" type="text" name="textEntry" autocomplete="off" tabindex="5" value="" /></div><div id="appstyle_modal"></div>';
    document.querySelector('body').appendChild(clipper);
    mouseX = -100;
    mouseY = -100;
    var c = document.getElementById('appstyle_canvas');
    var dpr = window.devicePixelRatio;
    pixZoomFactor = Math.floor(dpr);
    options.uiScaleFactor = 0.5;
    document.body.addEventListener('pointerleave', ev_mouseleave, false);
    document.body.addEventListener('pointerenter', ev_mouseenter, false);
    c.addEventListener('pointermove', ev_mousemove, false);
    c.addEventListener('pointerdown', ev_mousedown, false);
    c.addEventListener('pointerup', ev_mouseup, false);
    c.addEventListener('touchstart', ev_mousedown, { capture: false, passive: true });
    c.addEventListener('touchmove', ev_mousemove, { capture: false, passive: true });
    c.addEventListener('touchend', ev_mouseup, false);
    c.addEventListener('dblclick', ev_dblclick, false);
    document.addEventListener('keydown', ev_keydown, false);
    document.addEventListener('keyup', ev_keyup, false);
    document.addEventListener('keypress', ev_keypress, false);
    document.addEventListener('pointerup', ev_mouseup, false);
    doResize();
    window.onresize = function() { doResize(); }
    window.requestAnimationFrame(animationFrame);
    var fr = document.getElementById('focus_rest');
    if (fr) {
      fr.focus();
    }
  }
  
  function getMousePos(win) {
    var mp = {};
    if ((typeof win != "undefined") && (typeof win.private != "undefined")) {
      mp = getLocalPos(win, mouseX, mouseY);
    } else {
      mp = {x: mouseX, y: mouseY};
    }
    return mp;
  }

  document.addEventListener('DOMContentLoaded', function() {
    init();
  });
  
  function ready(fn) {
    if (initialised) {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }
  
  function findWindow(props) {
    var res = [];
    for (var i=0; i < windowList.length; i++) {
      var good = true;
      for (const key in props) {
        if (props.hasOwnProperty(key)) {
          if (! ((typeof windowList[i][key] != "undefined")
          && (windowList[i][key] == props[key]))) {
            good = false;
          }
        }
      }
      if (good) {
        res.push(windowList[i]);
      }
    }
    return res;
  }
  
  function getActiveWindow() {
    if (focusWid == -1) {
      return false;
    }
    return windowList[focusWid];
  }
  
  return {
    // basic usage
    ready: ready,
    registerWindowClass: registerWindowClass,
    makeWindow: makeWindow,
    closeWindow: closeWindow,
    setWidgetDefaults: setWidgetDefaults,
    invalidate: invalidate,
    redraw: redraw,
    bringToTop: bringToTop,
    bringToTopOnly: bringToTopOnly,
    activateWindow: activateWindow,
    triggerEvent: triggerEvent,

    // drawing functions
    drawBackground: drawBackground,
    drawWidgets: drawWidgets,
    measureText: measureText,
    drawText: drawText,
    drawTextCentered: drawTextCentered,
    drawFlatOutline: drawFlatOutline,
    drawBevel: drawBevel,
  
    // helper functions
    getActiveWindow: getActiveWindow,
    getMousePos: getMousePos,
    getLocalPos: getLocalPos,
    getWidgetById: getWidgetById,
    getWidgetPos: getWidgetPos,
    getCharPos: getCharPos,
    getCharFromPos: getCharFromPos,
    canWidgetFocus: canWidgetFocus,
    isWithinWidget: isWithinWidget,
    registerWidgetClass: registerWidgetClass,
    getWidgetAtPos: getWidgetAtPos,
    sameWidgetReference: sameWidgetReference,
    
    // auxiliary functions
    toggleFullScreen: toggleFullScreen,
    requestUpload: requestUpload,

    // widgets:
    text: text,
    textInput: textInput,
    custom: custom,

    // other things
    windowList: windowList,
    findWindow: findWindow,
    windowClasses: windowClasses,
    widgetClasses: widgetClasses,
    options: options,
    paintDesktopHook: null,
    theme: theme,
    internals: {
      download: download,
      getEnvironment: getEnvironment,
      saveEnvironment: saveEnvironment,
      loadEnvironment: loadEnvironment,
      resetEnvironment: resetEnvironment,
      processWindowMetrics: processWindowMetrics,
      forceRefresh: doResize,
      addPropsToObject: addPropsToObject,
      dragdrop: dragdrop,
      state: internalState
    }
  }

}());


appstyle.button = (function() {

  appstyle.registerWidgetClass('button', {
    inspectorText: function(win, widget) {
      return widget.caption;
    },
    paint: widgetPaintButton
  });

  function widgetPaintButton(win, ctx, widg, ofs) {
    ctx.beginPath();
    var xpd;
    xpd = (win.private.panelDepth + 8) * 16;
    var tint = [...appstyle.theme.bevelTint];
    if (widg.tint) {
      if ((typeof widg.tint == "string") && (widg.tint.substring(0, 1) == '#')) {
        if (widg.tint.length == 4) {
          tint[0] = parseInt(Number('0x' + widg.tint.substring(1,2)), 10) / 8;
          tint[1] = parseInt(Number('0x' + widg.tint.substring(2,3)), 10) / 8;
          tint[2] = parseInt(Number('0x' + widg.tint.substring(2,4)), 10) / 8;
        } else {
          tint[0] = parseInt(Number('0x' + widg.tint.substring(1,3)), 10) / 128;
          tint[1] = parseInt(Number('0x' + widg.tint.substring(3,5)), 10) / 128;
          tint[2] = parseInt(Number('0x' + widg.tint.substring(5,7)), 10) / 128;
        }
      } else {
        tint = widg.tint;
      }
    }
    var cr = (xpd*tint[0]);
    var cg = (xpd*tint[1]);
    var cb = (xpd*tint[2]);
    var color = 'rgb(' + cr + ',' + cg + ',' + cb + ')';
    var oclum = (cr * 3 + cg * 6 + cb);
    ctx.fillStyle = '#000000';
    var colorlum = 0;
    if (widg.color) {
      ctx.fillStyle = widg.color;
      if (widg.color.substring(0, 1) == '#') {
        if (widg.color.length == 6) {
          cr = parseInt(Number('0x' + widg.color.substring(1, 3)), 10);
          cg = parseInt(Number('0x' + widg.color.substring(3, 5)), 10);
          cb = parseInt(Number('0x' + widg.color.substring(5, 7)), 10);
          colorlum = (cr * 3 + cg * 6 + cb);
        }
      }
    }
    ctx.beginPath();
    ctx.rect(ofs.x,ofs.y,ofs.w+1,ofs.h+1);
    ctx.fill();
    ctx.beginPath();
    if ((!widg.flat)
    || (widg.hover && (appstyle.internals.state.mouseOverWid == win.private.wid) && (win.private.mouseTarget.id == widg.id))
    || (widg.highlight)) {
      ctx.fillStyle = color;
      colorlum = oclum;
    }
    ctx.rect(ofs.x+1,ofs.y+1,ofs.w-1,ofs.h-1);
    ctx.fill();
    var thick = Math.ceil(appstyle.options.uiScaleFactor * 5);
    if ((win.private.dragdrop) && (win.private.mouseTarget)) {
      pressed = (win.private.mouseTarget.id == widg.id)
      && (win.private.mouseTarget.id == appstyle.internals.dragdrop.source.id);
    } else {
      pressed = false;
    }
    if (!widg.flat) {
      appstyle.drawBevel(ctx, ofs, -(thick+2), thick+1, win.private.panelDepth+8, (!pressed), tint);
    }
    var prx = 0;
    var pry =0;
    if (pressed) {
      prx = Math.ceil(thick/2);
      pry = Math.ceil(thick/2);
    }

    var btnFore;
    if (win.private.active) {
      btnFore = appstyle.theme.colorActiveTextFore;
    } else {
      btnFore = appstyle.theme.colorInactiveTextFore;
    }
    if (colorlum > 1400) { // guesswork
      btnFore = '#000000';
    }
    
    let windowFontName = '"Helvetica"';
    
    if (widg.textAlign == 'left') {
      appstyle.drawText(win, ctx, prx+ofs.x+thick*3+1, pry+ofs.y+thick*2+1,
      ofs.w-thick*5-2,
      ofs.h-thick*4-2, widg.caption, windowFontName, btnFore);
    } else {
      appstyle.drawTextCentered(win, ctx, prx+ofs.x+thick*2+1, pry+ofs.y+thick*2+1,
      ofs.w-thick*4-2,
      ofs.h-thick*4-2, widg.caption, windowFontName, btnFore);
    }
  }

  var button = function(win, id, caption, props) {
    var o = {
      id: id,
      class: "button",
      caption: caption
    }
    appstyle.internals.addPropsToObject(o, win.private.defaultProps);
    appstyle.internals.addPropsToObject(o, props);
    if (typeof o.h == "undefined") {
      o.h = 1.5;
    }
    win.private.widgets.push(o);
  }

  return button;
}());

appstyle.pane = (function() {

  var pane = function(win, storage, props) {
    var o = {
      id: storage,
      class: 'pane',
      x: 20,
      y: 20,
      w: 300,
      h: 200,
      pixel:false,
      storage: storage
    };
    appstyle.internals.addPropsToObject(o, win.private.defaultProps);
    appstyle.internals.addPropsToObject(o, props);
    if (typeof o.horizontalScroll == "undefined") {
      o.horizontalScroll = false;
    }
    if (typeof o.verticalScroll == "undefined") {
      o.verticalScroll = false;
    }
    if (typeof o.x == "undefined") {
      o.x = 0;
    }
    if (typeof o.y == "undefined") {
      o.y = 0;
    }
    if (typeof o.h == "undefined") {
      o.h = win.h;
    }
    if (typeof o.w == "undefined") {
      o.w = win.w;
    }
    win.private.widgets.push(o);
  }

  function widgetPaintPane(win, ctx, widg, ofs) {
    if (widg.id != '') {
      if (typeof win.storage[widg.storage] == "undefined") {
        win.storage[widg.storage] = {originX: 0, originY: 0};
      }
      ctx.beginPath();
      ctx.rect(ofs.x-2,ofs.y-2,ofs.w+4,ofs.h+4);
      var needDepth = false;
      var thick = Math.ceil(appstyle.options.uiScaleFactor * 5);
      if (typeof win.private.panelDepth == "undefined") {
        win.private.panelDepth = 0;
      }

      if ((typeof widg.noBackground == "undefined")
      || (!widg.noBackground)) {
        win.private.panelDepth++;
        needDepth = true;
        var xpd = (win.private.panelDepth + 1) * 16;
        ctx.fillStyle = 'rgb(' + (xpd*appstyle.theme.bevelTint[0]) + ',' +
        (xpd*appstyle.theme.bevelTint[1]) + ',' + (xpd*appstyle.theme.bevelTint[2]) + ')';
        ctx.fill();
      }

      if ((typeof widg.noBorder == "undefined")
      || (!widg.noBorder)) {
      
        if (!widg.flat) {
          appstyle.drawBevel(ctx, ofs, 1 + thick*2, thick, win.private.panelDepth-1, true)
          appstyle.drawBevel(ctx, ofs, 1, thick, win.private.panelDepth, false);
        }
        var xpd;
        xpd = (win.private.panelDepth + 2) * 16;
        var color = 'rgb(' + (xpd*appstyle.theme.bevelTint[0]) + ',' +
        (xpd*appstyle.theme.bevelTint[1]) + ',' + (xpd*appstyle.theme.bevelTint[2]) + ')';
        if (!widg.flat) {
          appstyle.drawFlatOutline(ctx, ofs, 1+thick, thick, color);
        }
      }
      ctx.beginPath();
      ctx.save();
      // set up clip area for the window paint handler
      ctx.beginPath();
      ctx.rect(ofs.x, ofs.y, ofs.w, ofs.h);
      ctx.clip();
      if (win.paintPane) {
        var scrpos = appstyle.getCharPos(win, win.storage[widg.storage].originX, win.storage[widg.storage].originY);
        var pane = {
          widget: widg,
          pixelOriginX: scrpos.x,
          pixelOriginY: scrpos.y,
          originX: win.storage[widg.storage].originX,
          originY: win.storage[widg.storage].originY
        };
        ctx.save();
        ctx.translate(ofs.x,ofs.y);
        var pp = win.paintPane(win, ctx, pane);
        ctx.restore();
        if (typeof pp == "undefined") {
          pp = true;
        }
        if (pp) {
          appstyle.drawWidgets(win, ctx, widg.id);
        }
      } else {
        appstyle.drawWidgets(win, ctx, widg.id);
      }
      ctx.restore();
      if (needDepth) {
        win.private.panelDepth--;
      }
    }
  }

  function paneGetWidgetAtPos(win, widg, x, y, parentReference) {
    if (widg.id != '') {
      var wpos = {x: 0, y: 0};

      if ((typeof widg.storage != "undefined")
      && (widg.storage != '')
      && (typeof win.storage[widg.storage] != "undefined")) {
        if (typeof win.storage[widg.storage].originX != "undefined") {
          wpos.x = win.storage[widg.storage].originX;
        }
        if (typeof win.storage[widg.storage].originY != "undefined") {
          wpos.y = win.storage[widg.storage].originY;
        }
      }

      var spos = appstyle.getCharPos(win, wpos.x, wpos.y);
      r = appstyle.getWidgetAtPos(win, x + 0*spos.x, y + 0*spos.y, parentReference);
    }
    return r;
  }

  function widgetPaneDragging(win) {
    var win = appstyle.windowList[appstyle.internals.dragdrop.wid];
    var widget = appstyle.getWidgetById(win, appstyle.internals.dragdrop.source.id);
    if (typeof win.storage[widget.storage] == "undefined") {
      win.storage[widget.storage] = {originX: 0, originY: 0};
    }
    if (typeof win.private.dragMemoX == "undefined") {
      win.private.dragMemoX = win.storage[widget.storage].originX;
      win.private.dragMemoY = win.storage[widget.storage].originY;
    }
    var mousePos = appstyle.getMousePos();
    var mpos = appstyle.getCharFromPos(win, mousePos.x, mousePos.y);
    var dpos = appstyle.getCharFromPos(win, appstyle.internals.dragdrop.x, appstyle.internals.dragdrop.y);
    if (widget.horizontalScroll) {
      win.storage[widget.storage].originX = win.private.dragMemoX - (mpos.x - dpos.x);
    }
    if (widget.verticalScroll) {
      win.storage[widget.storage].originY = win.private.dragMemoY - (mpos.y - dpos.y);
    }
  }

  appstyle.registerWidgetClass('pane', {
    paint: widgetPaintPane,
    getWidgetAtPos: paneGetWidgetAtPos,
    dragging: widgetPaneDragging
  });
  
  return pane;
}());
