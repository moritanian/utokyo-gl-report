/*
  # abstraction
  glsl base script 
  this script is forked from http://qiita.com/doxas/items/000f2ad6f82c27bd389e

  # usage
  1. Make shader files : vertex-shader.vs and fragment-shader.fs.
  2. Add the above code in your html file.
     You can also embed shader text in the same tag.

  <script type="text/javascript" src="js/glsl-base.js"></script>
  <script id="vs" source="shader/vertex-shader.vs" type="xs/fs"></script>
  <script id="fs" source="shader/fragment-shader.fs"  type="xs/fs"></script>

  3. Your can choose debug mode with options.
  
  <glsl-base>
    <debug value="true"></debug>
    <tab-size value="6"></tab-size>
  </glsl-base>

*/

// オンロードイベントがエントリポイント
window.onload = function(){

  function loadFile(url, data, callback, errorCallback) {
    // Set up an asynchronous request
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    // Hook the event that gets called as the request progresses
    request.onreadystatechange = function () {
        // If the request is "DONE" (completed or failed)
        if (request.readyState == 4) {
            // If we got HTTP status 200 (OK)
            if (request.status == 200) {
                callback(request.responseText, data)
            } else { // Failed
                errorCallback(url);
            }
        }
    };

    request.send(null);    
  }

  function loadFiles(urls, callback, errorCallback) {
      var numUrls = urls.length;
      var numComplete = 0;
      var result = new Array(numUrls);

      // Callback for a single file
      function partialCallback(text, urlIndex) {
          result[urlIndex] = text;
          numComplete++;

          // When all files have downloaded
          if (numComplete == numUrls) {
              callback(result);
          }
      }

      for (var i = 0; i < numUrls; i++) {
          loadFile(urls[i], i, partialCallback, errorCallback);
      }
  }

  function loadShaders(){
    var vsDom = b('vs');
    var fsDom = b('fs');
    var vsUrl = vsDom.getAttribute('source');
    var fsUrl = fsDom.getAttribute('source');
    var resolve, reject;
    
    reject = function(e){
      console.warn(e);
      console.warn("An error has occured with loading the shadering file.");
    };

    if(vsUrl && fsUrl){
      resolve = function(ts){
        webglSetup(ts[0], ts[1]);
      }
      loadFiles([vsUrl, fsUrl], resolve, reject);
    }else if(vsUrl){
      resolve = function(t){
        webglSetup(t,  fsDom.text);
      };
      loadFile(vsUrl, 0, resolve, reject);
    } else if(fsUrl){
      resolve = function(t){
        webglSetup(vsDom.text, t);
      };
      loadFile(fsUrl, 0, resolve, reject);
    } else {
      webglSetup(vsDom.text, fsDom.text);
    }
  }

  // 変数宣言
  var a, b, c, d, e, f, g, h, m, l, p, t, u, v, w, x, y, z, dbg, dbgOpt, gebt;

  // document.getElementByIdをローカル変数に
  b = function(s){return document.getElementById(s)};

  // keydownに登録する関数
  function k(h){e = (h.keyCode !== 27);}

  // mouse
  m = [0.5, 0.5];

  // ウィンドウオブジェクト
  w = window;

  // debug mode
  gebt = function(t){return document.getElementsByTagName(t)};
  dbg = false;
  dbgOpt = {tab: "\t"};

  var glsl_base_e = gebt('glsl-base');
  if(glsl_base_e && glsl_base_e.length > 0){
    var children = glsl_base_e[0].childNodes;
    for(var i=0; i<children.length; i++){
      if(i%2 == 0)
        continue;
      var ce = children[i];
      
      switch(ce.tagName){
        case "DEBUG":
          dbg = ce.getAttribute('value') === "true";
          break;

        case "TAB-SIZE":
          
          var tabSize = parseInt(ce.getAttribute('value')); 
          dbgOpt.tabSize = tabSize;
          dbgOpt.tab = "";
          for(var id=0; id < tabSize; id++){
            dbgOpt.tab += " ";
          }
          break;
      }
    }
  }

  // ESCキーで描画を止めるためのイベントハンドラ
  w.addEventListener('keydown', k, true);

  // HTMLドキュメント内のcanvasへの参照
  c = b('c');

  // WebGLコンテキストの取得
  g = c.getContext('webgl');

  // プログラムオブジェクトの生成
  p = g.createProgram();

  loadShaders();
  
  function webglSetup (vsText, fsText){

    // シェーダ生成関数
    h = function(i, j){
      // シェーダオブジェクト生成
      k = g.createShader(g.VERTEX_SHADER - i);

      // ソースの割り当て
      g.shaderSource(k, j);

      // シェーダのコンパイル
      g.compileShader(k);

      // シェーダのアタッチ
      g.attachShader(p, k);

      l =  g.getShaderInfoLog(k);
      
      // コンパイルエラー
      //if(l){
        if( l || dbg ){
          var errorIndexList = [];
          var lE0 = b('glsl-base-debug-container');
          var lEn = b('glsl-base-debug-normalizer');
          var lEm = b('glsl-base-debug-main');
          var lE = b('glsl-base-debug');
          
          lE0.style.display = 'block';
          //lE.textContent = errorLines;

          var errorLines = l.split('\n');
          var lines = j.split("\n");
          var ppe, pe, cp1, cp2, c1, c2;
          
          ppe = document.createElement("p");
          ppe.classList.add('code-line');
          
          cp1 = document.createElement("pre");
          cp1.classList.add('line-number');
          
          cp2 = document.createElement("pre");
          cp2.classList.add('line-content');
          
          var highLigts = {
            'hl-val-type': ['bool', 'int', 'float', 'vec2', 'vec3', 'vec4', 
              'struct', 'void', 'bvec2', 'bvec3', 'bvec4', 'ivec2', 'ivec3', 
              'ivec4', 'mat2', 'mat3', 'mat4', 'sampler2D', 'samplerCube',
              'highp', 'mediump', 'lowp'],
            'hl-attribute': ['in', 'inout', 'out', 'uniform', 'varying', 'const'],
            'hl-operator': ['+', '-', '*', '/', '||', '|', '&&', '&', '=', 
              '<', '>', '<=', '>=', '==', '!'],
            'hl-bracket' : ['(', ')', '{', '}', ';', '.', ','],
            'hl-conditional-operator': ['if', 'return', 'else', 'while', 'for'],
            'hl-builtin-function': ['pow', 'exp', 'sqrt', 'abs', 'sign', 
              'floor', 'ceil', 'fract', 'mod', 'min', 'max', 'radians', 'degrees',
              'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 
              'length', 'distance', 'dot', 'cross', 'normalize', 
              'equal'],
            'hl-primitive-val': ['true', 'false']
          };
          //var highLightsHash = {'bool' : 'hl-val-type','int' : 'hl-val-type','float' : 'hl-val-type','vec2' : 'hl-val-type','vec3' : 'hl-val-type','vec4' : 'hl-val-type','struct' : 'hl-val-type','void' : 'hl-val-type','bvec2' : 'hl-val-type','bvec3' : 'hl-val-type','bvec4' : 'hl-val-type','ivec2' : 'hl-val-type','ivec3' : 'hl-val-type','ivec4' : 'hl-val-type','mat2' : 'hl-val-type','mat3' : 'hl-val-type','mat4' : 'hl-val-type','sampler2D' : 'hl-val-type','samplerCube' : 'hl-val-type','in' : 'hl-attribute','inout' : 'hl-attribute','out' : 'hl-attribute','uniform' : 'hl-attribute','varying' : 'hl-attribute','+' : 'hl-operator','-' : 'hl-operator','*' : 'hl-operator','/' : 'hl-operator','||' : 'hl-operator','|' : 'hl-operator','&&' : 'hl-operator','&' : 'hl-operator','=' : 'hl-operator','if' : 'hl-operator','return' : 'hl-operator','else' : 'hl-operator','while' : 'hl-operator','for' : 'hl-operator','<' : 'hl-operator','>' : 'hl-operator','<=' : 'hl-operator','>=' : 'hl-operator','==' : 'hl-operator','pow' : 'hl-builtin-function','exp' : 'hl-builtin-function','sqrt' : 'hl-builtin-function','abs' : 'hl-builtin-function','sign' : 'hl-builtin-function','floor' : 'hl-builtin-function','ceil' : 'hl-builtin-function','fract' : 'hl-builtin-function','mod' : 'hl-builtin-function','min' : 'hl-builtin-function','max' : 'hl-builtin-function','radians' : 'hl-builtin-function','degrees' : 'hl-builtin-function','sin' : 'hl-builtin-function','cos' : 'hl-builtin-function','tan' : 'hl-builtin-function','asin' : 'hl-builtin-function','acos' : 'hl-builtin-function','atan' : 'hl-builtin-function','length' : 'hl-builtin-function','distance' : 'hl-builtin-function','dot' : 'hl-builtin-function','cross' : 'hl-builtin-function','normalize' : 'hl-builtin-function','equal' : 'hl-builtin-function'};
          
          var highLightsHash = {};
          for(var h in highLigts){
            for(var h2 in highLigts[h]){
              highLightsHash[highLigts[h][h2]] = h;
            }
          }

          /*
          var l = "";
          for(var i in highLightsHash){
            l += `'${i}' : '${highLightsHash[i]}',`;
          }
          
          
          var highLightsHash = {

          }
          */

          // 単語に分割するための正規表現生成
          const hlComment = 'hl-comment';
          const hlSharp = 'hl-sharp';
          const hlUserStruct = 'hl-user-struct';

          var userStructs = {};

          function getStructClass(sName){
            return `hl-struct-${sName}`;
          }
          
          var patterForLineSplit = (function(){

            const hlSplitTypes = [
              'hl-operator',
              'hl-bracket'
            ];


            var ex = "(";

            for (var type of hlSplitTypes){
              for(var i1 in highLigts[type]){
                for(var i2 in highLigts[type][i1]){
                  ex += "\\" + highLigts[type][i1][i2];
                }
                ex += "|";
              }
            }
            
            ex += " |\t)";
            
            return RegExp(ex);
          
          })();
            
          function getHighLight(word){
            
            for(var h of highLigts){
              for(var h2 of highLigts[h]){
                if(h2 === word){
                  return h;
                }
              }
            
            }
            
            return "";
          
          }

          function getHighLightFromHash(word){
          
            return highLightsHash[word] || "";
          
          }

          function getHighLightSpan(word, _class){
            if(_class instanceof  Array){
              _class = _class.join(' ');
            }
          
            return `<span class='${_class}'>${word}</span>`;
          
          }

          function highLightOneLine(line, status = {}){
            var innerHTML = "", comment = "";
            
            // #defineとか
            if(line !== "" && line[0] === "#"){
              return getHighLightSpan(line, hlSharp)
            }

            // 複数行コメント
            var m0 = line.split(/(\/\*|\*\/)/);
            for(var wi in m0){
              var wd = m0[wi];
              
              if(wd == "")
                continue;
              
              if(wd === "\/\*"){
              
                status.isComment = true;
                comment += wd;

              } else if(wd == "\*\/"){

                comment += wd;
                status.isComment = false;
                innerHTML += getHighLightSpan(comment, hlComment);
                comment = "";

              } else if(status.isComment){
                
                comment += wd;
              
              } else if(!status.isComment){
              
                innerHTML += _highLightOneLine(wd);
              
              }
            }

            return innerHTML + (comment !== "" ? getHighLightSpan(comment, hlComment) : "");
          }

          function _highLightOneLine(line){
            var comment = "";
            var m = line.split(/(\/\/)/);
            var codeline = m[0];
            
            // コメントアウトの部分をつなぎ合わせる #TODO もっといい方法ありそう
            for (id = 1; id < m.length; id++){
              comment += m[id];
            }

            var words = codeline.split(patterForLineSplit);

            return highLighWordsInLine(words, comment);
          }

          function highLighWordsInLine(words, comment){
            var isNextStructName = false;
            var isNextValName = false;
            var  innerHTML = "";
            for(var wi in words){

              var word = words[wi];
              
              if(word === "")
                continue;
              
              // tab
              if(word == "\t")
                 word = dbgOpt.tab;
              
              if(word === " "){
              
                innerHTML += " ";
              
              } else {
                //var hl = getHighLight(word);
                var hl = getHighLightFromHash (word);
                //if(word === 'struct'){
                //if(word in highLigts['hl-val-type']){
                if(hl == 'hl-val-type' || userStructs[word]){
                  
                  if(word === 'struct'){
                    isNextStructName = true;
                  }

                  if(userStructs[word]){
                    hl = [hl, hlUserStruct];
                  }
                  
                  isNextValName = true;
                
                } else if(isNextValName){
                

                  if(isNextStructName){
                    isNextStructName = false;
                    hl = [hl, getStructClass(word), hlUserStruct];
                    userStructs[word] = true;
                  } else {
                  
                    hl = [hl, getStructClass(word)];
                  
                  }

                  isNextValName = false;
                }
                
                innerHTML += getHighLightSpan(word, hl);
              
              }
            }

            if(comment){
              innerHTML += getHighLightSpan(comment, hlComment);
            }
            
            return innerHTML;
          }


          var lastRow = -1;
          var errRow;
          var firstErrorLineElement;
          for(index = 0; index < errorLines.length; index++ ){
              //var e = errorLines[index].split(' ');
              var errInfo = errorLines[index].match(/^ERROR:\D+\d+\D+(\d+)\D+$/)
              if(errInfo && errInfo.length > 1){
                errRow = parseInt(errInfo[1]);

                if(lastRow == errRow){
                  errorIndexList[errorIndexList.length - 1].contents.push(errInfo[0]);
                } else {
                  errorIndexList.push({
                    "row": errRow,
                    "contents": [errInfo[0]]
                  });
                  lastRow = errRow;
                }

                //console.log(errInfo[1]);
                //console.log(errInfo);

              }
              pe = ppe.cloneNode();
              pe.textContent = errorLines[index];
              lE.appendChild(pe);
          }

          var errHead = 0;
          var errorNum = errorIndexList.length;

          var errContentElement = document.createElement('div');
          errContentElement.classList.add('err-content');
          errContentElement.style.display = 'none';
          document.body.appendChild(errContentElement);

          var hlStatus = {isComment : false};
          for(var index = 0; index < lines.length; index++){
            pe = ppe.cloneNode();
            c1 = cp1.cloneNode();
            c2 = cp2.cloneNode();
            c1.textContent = index + 1;

            c2.innerHTML =  highLightOneLine(lines[index], hlStatus);

            //c2.textContent = lines[index];
            pe.appendChild(c1);
            pe.appendChild(c2);
            if(errorNum > 0  && errorIndexList[errHead]["row"] === index + 1){
              pe.classList.add('error-line');

              (function(){
                var ei = errHead;
                pe.onmouseover = function(e){
                  errContentElement.textContent = errorIndexList[ei]["contents"][0];
                  errContentElement.style.left = e.clientX + 40 + "px";
                  errContentElement.style.top = e.clientY - 40 + "px";
                  this.classList.add('hover-line');
                  errContentElement.style.display = 'block';
                }
                pe.onmouseout = function(){
                  errContentElement.style.display = 'none';
                  this.classList.remove('hover-line');
                }
              })();
              
              if(errHead + 1 < errorNum ){
                errHead +=1;
              }
              if(!firstErrorLineElement){
                firstErrorLineElement = pe;
              }
            }
            lE.appendChild(pe);
            
          }

          //document.body.appendChild(lE);

          function rangeWord(element){
            var rng = document.createRange();
            rng.selectNodeContents(element);
            window.getSelection().addRange(rng);
          }
       
          var activeWordElem;
          lE.addEventListener('dblclick', function(e){
            var elm = document.elementFromPoint(e.clientX, e.clientY);
            var tgClass = getStructClass(elm.textContent);
            var cs = document.getElementsByClassName(tgClass);
            if(cs.length > 0){
              activeWordElem = cs[0];
              var tp =  activeWordElem.getBoundingClientRect().top - w.innerHeight / 2 ;
              lE.scrollTop  += tp;
              //rangeWord(cs[0]);
              activeWordElem.classList.add('active-word');
            }
          });

          lE.addEventListener('click', function(e){
            if(activeWordElem){
              activeWordElem.classList.remove('active-word');
            }
          });

          document.getElementsByClassName('minimize-btn')[0].addEventListener('click', function(e){
            lEm.style.display = "none";
            lEn.style.display = "block";
          });
          lEn.addEventListener('click', function(){
            lEm.style.display = "block";
            lEn.style.display = "none";
          });

          // 最初のエラーラインにスクロール
          (function(){
            if(!firstErrorLineElement)
              return;

            var sc = 0;
            var top = firstErrorLineElement.getBoundingClientRect().top - w.innerHeight / 2;
            var st = 0.05;
            var t = 0.3;
            (function scrollToErrorLine(){
              if(sc < top)
                setTimeout(scrollToErrorLine, st * 1000);

              lE.scrollTop = sc;
              sc += top * st / t;
            })();
          })();
          console.log(l);
        }

      //}

      // ログをリターン
      return l;
    }

    // シェーダのコンパイルとリンク
    //if(!h(0, b('vs').text) && !h(1, b('fs').text)){g.linkProgram(p);}
    if(!h(0, vsText) && !h(1, fsText)){g.linkProgram(p);}

    // シェーダのリンクステータスをチェック
    e = g.getProgramParameter(p, g.LINK_STATUS);

    // プログラムオブジェクトの有効化
    g.useProgram(p);

    // uniformLocation格納用にオブジェクトを定義
    u = {};

    // uniform変数timeのロケーション取得
    u.time = g.getUniformLocation(p, 'time');

    // uniform変数resolutionのロケーション取得
    u.resolution = g.getUniformLocation(p, 'resolution');

     // uniform変数mouseのロケーション取得
    u.mouse = g.getUniformLocation(p, 'mouse');
   
    // mouse 座標取得
    document.addEventListener("mousemove", function(e){m[0] = e.clientX/x; m[1] = e.clientY/y;});
    //document.addEventListener('resize', function(e){sX = window.parent.screen.width; sY = window.parent.screen.height;});
  
    // VBO用のバッファオブジェクトを生成
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());

    // VBOに頂点データを登録
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1,1,0,-1,-1,0,1,1,0,1,-1,0]), g.STATIC_DRAW);

    // attributeロケーション取得
    a = g.getAttribLocation(p, 'position');

    // attribute有効化
    g.enableVertexAttribArray(a);
    g.vertexAttribPointer(a, 3, g.FLOAT, false, 0, 0);

    // 初期化時の色を黒に指定
    g.clearColor(0, 0, 0, 1);

    // 動作開始時間を取得（時間の経過を調べるため）
    z = new Date().getTime();

    // メインルーチン
    (function render(){
      // シェーダのリンクに失敗していたら実行しない
      if(!e){return;}

      // ビューポートを動的に指定する
      c.width = x = w.innerWidth;
      c.height = y = w.innerHeight;
      g.viewport(0, 0, x, y);

      // 時間の経過を調べる
      d = (new Date().getTime() - z) * 0.001;

      // フレームバッファをクリア
      g.clear(g.COLOR_BUFFER_BIT);

      // uniform変数をプッシュ
      g.uniform1f(u.time, d);
      g.uniform2fv(u.resolution, [x, y]);
      g.uniform2fv(u.mouse, m);

      // プリミティブのレンダリング
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
      g.flush();

      // 再起
      requestAnimationFrame(render);
    })();
  }
}
