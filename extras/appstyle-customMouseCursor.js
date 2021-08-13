appstyle.options.drawCursor = (function() {

  appstyle.options.useSystemCursor = false;

  function rgbToHex(r, g, b){
    if (r > 255 || g > 255 || b > 255) {
      throw "Invalid color component";
    }
    return ((r << 16) | (g << 8) | b).toString(16);
  }

  function rgbToCSS(rgb) {
    return "#" + ("000000" + rgbToHex(rgb[0], rgb[1], rgb[2])).slice(-6);
  }

  function rgb2hsv(rgb) {
    let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
    rabs = rgb[0] / 255;
    gabs = rgb[1] / 255;
    babs = rgb[2] / 255;
    v = Math.max(rabs, gabs, babs),
    diff = v - Math.min(rabs, gabs, babs);
    diffc = c => (v - c) / 6 / diff + 1 / 2;
    percentRoundFn = num => Math.round(num * 100) / 100;
    if (diff == 0) {
        h = s = 0;
    } else {
      s = diff / v;
      rr = diffc(rabs);
      gg = diffc(gabs);
      bb = diffc(babs);

      if (rabs === v) {
          h = bb - gg;
      } else if (gabs === v) {
          h = (1 / 3) + rr - bb;
      } else if (babs === v) {
          h = (2 / 3) + gg - rr;
      }
      if (h < 0) {
          h += 1;
      }else if (h > 1) {
          h -= 1;
      }
    }
    return [Math.round(h * 359), percentRoundFn(s * 100), percentRoundFn(v * 100)];
  }

  function hsv2rgb(hsv) {
    var h = Math.max(0, Math.min(1, hsv[0] / 359));
    var s = hsv[1] / 100;
    var v = hsv[2] / 100;
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function perceptive(col) {
    return Math.floor((col[0] * 0.3) + (col[1] * 0.59) + (col[2] * 0.11));
  }

  function contrasting(rgb) {
    var perc = perceptive(rgb);
    var hsv = rgb2hsv(rgb);

    var mpart = 1;
    var npart = 0;
    if ((hsv[1] <= 0)
    && (hsv[2] >= 10)) {
      npart = 1;
      mpart = 0;
    }

    var nhsv = [0,0,0];
    nhsv[1] = 100;
    if (hsv[2] >= 95) {
      nhsv[0] = 0;
      nhsv[1] = 0;
      nhsv[2] = 0;
    } else if (hsv[2] <= 5) { // white
      nhsv[0] = 0;
      nhsv[1] = 0;
      nhsv[2] = 100;
    } else {  // fire gradient
      nhsv[0] = (360 + 80 - 2.3*(hsv[2])) % 360;
      nhsv[1] = 100;
      var bval = Math.min(100, (100-hsv[2]) * 0.5);
      nhsv[2] = Math.min(100, bval * bval);
    }

    var mhsv = [0,0,0];
    if (hsv[2] < 10) {
      mhsv[2] = 100;
    } else {
      mhsv[0] = (hsv[0] + 180) % 360;
      mhsv[1] = 100;
      mhsv[2] = Math.min(100, 120 - (perc*100/256));
      var mperc = perceptive(hsv2rgb(mhsv));
      mhsv[0] = (mhsv[0] + (mhsv[2] - mperc*100/256)/2) % 360;
      var mperc = perceptive(hsv2rgb(mhsv));
      mhsv[0] = (mhsv[0] + (mhsv[2] - mperc*100/256)/2) % 360;
      var mperc = perceptive(hsv2rgb(mhsv));
      mhsv[1] = Math.max(0, mhsv[1] - (256-mperc)/256*40);
    }

    var nrgb = hsv2rgb(nhsv);
    var mrgb = hsv2rgb(mhsv);
    var crgb = [
      Math.max(0,Math.min(255,nrgb[0]*npart + mrgb[0]*mpart)),
      Math.max(0,Math.min(255,nrgb[1]*npart + mrgb[1]*mpart)),
      Math.max(0,Math.min(255,nrgb[2]*npart + mrgb[2]*mpart))
    ];
    return crgb;
  }

  function paintCursor(ctx, cursorType, mouseX, mouseY) {
    if (cursorType == 5) {
      cursorType = 0;
    }

    if (appstyle.internals.state.inputHideMouse || appstyle.internals.state.boundsHideMouse) {
      cursorType = -1;
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    var size = appstyle.options.uiScaleFactor;
    var lofs = 0;
    var xofs = 0;
    var yofs = 0;


    // Arrow
    if (cursorType == 0) {
      xofs = 0.5;
    }

    // Crosshair
    if (cursorType > 0) {
      size = size * 1.2;
      xofs = -24*size;
      yofs = -24*size;
    }
    if (cursorType >= 2) {
      size = size * 1.3;
    }

    if ((mouseX >= 0) && (mouseY >= 0)) {
      var my_gradient = ctx.createLinearGradient(Math.floor(mouseX+xofs), Math.floor(mouseY+yofs),
        Math.floor(mouseX+xofs+size*30), Math.floor(mouseY+yofs+size*50));
      my_gradient.addColorStop(0, "#ff0000");
      my_gradient.addColorStop(0.6, "#0000ff");
      my_gradient.addColorStop(1, "#009900");
      ctx.fillStyle = my_gradient;
    } else {
      ctx.fillStyle = '#000000';
    }

    if (cursorType == 0) {
      lofs = -0.2
      ctx.beginPath();
      ctx.moveTo(mouseX+xofs+lofs,    mouseY);
      ctx.lineTo(mouseX+xofs+lofs,    mouseY+51*size); // left edge
      ctx.lineTo(mouseX+xofs+10*size+lofs, mouseY+36*size); // left barb
      ctx.lineTo(mouseX+xofs+21*size+lofs, mouseY+60*size); // left tail
      ctx.lineTo(mouseX+xofs+31*size, mouseY+56*size); // bottom tail
      ctx.lineTo(mouseX+xofs+20*size, mouseY+32*size); // right tail
      ctx.lineTo(mouseX+xofs+36*size, mouseY+32*size); // right barb
      ctx.lineTo(mouseX+xofs, mouseY); // right edge
      ctx.fill();
      ctx.stroke();
    }

    if (cursorType == 2) {
      ctx.beginPath();
      ctx.moveTo(mouseX-24*size,mouseY+00*size);
      ctx.lineTo(mouseX-12*size,mouseY-10*size);
      ctx.lineTo(mouseX-12*size,mouseY-03*size);
      ctx.lineTo(mouseX-03*size,mouseY-03*size);
      ctx.lineTo(mouseX-03*size,mouseY-20*size);
      ctx.lineTo(mouseX+03*size,mouseY-20*size);
      ctx.lineTo(mouseX+03*size,mouseY-03*size);
      ctx.lineTo(mouseX+12*size,mouseY-03*size);
      ctx.lineTo(mouseX+12*size,mouseY-10*size);
      ctx.lineTo(mouseX+24*size,mouseY-00*size);
      ctx.lineTo(mouseX+12*size,mouseY+10*size);
      ctx.lineTo(mouseX+12*size,mouseY+03*size);
      ctx.lineTo(mouseX+03*size,mouseY+03*size);
      ctx.lineTo(mouseX+03*size,mouseY+20*size);
      ctx.lineTo(mouseX-03*size,mouseY+20*size);
      ctx.lineTo(mouseX-03*size,mouseY+03*size);
      ctx.lineTo(mouseX-12*size,mouseY+03*size);
      ctx.lineTo(mouseX-12*size,mouseY+10*size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if (cursorType == 3) {
      ctx.beginPath();
      ctx.moveTo(mouseX+00*size,mouseY-24*size);
      ctx.lineTo(mouseX-10*size,mouseY-12*size);
      ctx.lineTo(mouseX-03*size,mouseY-12*size);
      ctx.lineTo(mouseX-03*size,mouseY-03*size);
      ctx.lineTo(mouseX-20*size,mouseY-03*size);
      ctx.lineTo(mouseX-20*size,mouseY+03*size);
      ctx.lineTo(mouseX-03*size,mouseY+03*size);
      ctx.lineTo(mouseX-03*size,mouseY+12*size);
      ctx.lineTo(mouseX-10*size,mouseY+12*size);
      ctx.lineTo(mouseX-00*size,mouseY+24*size);
      ctx.lineTo(mouseX+10*size,mouseY+12*size);
      ctx.lineTo(mouseX+03*size,mouseY+12*size);
      ctx.lineTo(mouseX+03*size,mouseY+03*size);
      ctx.lineTo(mouseX+20*size,mouseY+03*size);
      ctx.lineTo(mouseX+20*size,mouseY-03*size);
      ctx.lineTo(mouseX+03*size,mouseY-03*size);
      ctx.lineTo(mouseX+03*size,mouseY-12*size);
      ctx.lineTo(mouseX+10*size,mouseY-12*size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    if (cursorType == 4) { // diagonal resize
      ctx.beginPath();
      ctx.moveTo(mouseX-18*size,mouseY-18*size);
      ctx.lineTo(mouseX -0*size,mouseY-18*size);
      ctx.lineTo(mouseX -7*size,mouseY-12*size);
      ctx.lineTo(mouseX+12*size,mouseY +7*size);
      ctx.lineTo(mouseX+18*size,mouseY +0*size);
      ctx.lineTo(mouseX+18*size,mouseY+18*size);
      ctx.lineTo(mouseX +0*size,mouseY+18*size);
      ctx.lineTo(mouseX +7*size,mouseY+12*size);
      ctx.lineTo(mouseX-12*size,mouseY -7*size);
      ctx.lineTo(mouseX-18*size,mouseY -0*size);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

   // Crosshair Cursor
    if (cursorType == 1) {
      var p, g;
      if ((mouseX >= 0) & (mouseY >= 0)) {
        try {
          p = ctx.getImageData(mouseX, mouseY, 1, 1).data;
        } catch(err) {
        }
        if (typeof p == "undefined") {
          p = [0,0,0];
        }
        p = [p[0],p[1],p[2]];
      } else {
        p = [0,0,0];
      }
      g = [0,0,0];
      g = contrasting(p);

      var hex = "#" + ("000000" + rgbToHex(g[0], g[1], g[2])).slice(-6);
      ctx.lineWidth = 1;
      ctx.strokeStyle = hex;
      ctx.beginPath();
      ctx.moveTo(mouseX, mouseY - 8*size);
      ctx.lineTo(mouseX, mouseY - 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mouseX, mouseY + 1);
      ctx.lineTo(mouseX, mouseY + 8*size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mouseX - 8*size,  mouseY);
      ctx.lineTo(mouseX - 1, mouseY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mouseX + 1,  mouseY);
      ctx.lineTo(mouseX + 8*size, mouseY);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';

      ctx.lineWidth = 1.2;
      ctx.beginPath(); // top
      ctx.moveTo(mouseX -4*size, mouseY -24*size);
      ctx.lineTo(mouseX +4*size, mouseY -24*size);
      ctx.lineTo(mouseX +4*size, mouseY -14*size);
      ctx.lineTo(mouseX,         mouseY  -8*size);
      ctx.lineTo(mouseX -4*size, mouseY -14*size);
      ctx.lineTo(mouseX -4*size, mouseY -24*size);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath(); // left
      ctx.moveTo(mouseX -24*size,  mouseY - 4*size);
      ctx.lineTo(mouseX -24*size,  mouseY + 4*size); // left edge
      ctx.lineTo(mouseX -14*size,  mouseY + 4*size); // bottom edge
      ctx.lineTo(mouseX -8*size,   mouseY); // bottom diagonal
      ctx.lineTo(mouseX -14*size,  mouseY -4*size); // top diagonal
      ctx.lineTo(mouseX -24*size,  mouseY -4*size); // top edge
      ctx.fill();
      ctx.stroke();
      ctx.beginPath(); // bottom
      ctx.moveTo(mouseX,          mouseY + 8*size);
      ctx.lineTo(mouseX + 4*size, mouseY + 14*size); // right diagonal
      ctx.lineTo(mouseX + 4*size, mouseY + 24*size); // right edge
      ctx.lineTo(mouseX -4*size,  mouseY + 24*size); // bottom edge
      ctx.lineTo(mouseX -4*size,  mouseY + 14*size); // left edge
      ctx.lineTo(mouseX,          mouseY + 8*size); // left diagonal
      ctx.fill();
      ctx.stroke();
      ctx.beginPath(); // right
      ctx.moveTo(mouseX + 8*size,   mouseY); // tip
      ctx.lineTo(mouseX + 14*size,  mouseY -4*size); // top diagonal
      ctx.lineTo(mouseX + 24*size,  mouseY -4*size); // top edge
      ctx.lineTo(mouseX + 24*size,  mouseY +4*size); // right edge
      ctx.lineTo(mouseX + 14*size,  mouseY +4*size); // bottom edge
      ctx.lineTo(mouseX + 8*size,   mouseY);
      ctx.fill();
      ctx.stroke();
    }
  }

  return paintCursor;

}());
