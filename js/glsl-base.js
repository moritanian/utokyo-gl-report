/*
  # abstract
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

     // 変数宣言
    var a, b, c, d, e, f, g, h, m, l, p, t, u, v, w, x, y, z;
    var dbg, dbgOpt, gebt, vsFilePath, fsFilePath, review;

    vsFilePath = "vertex.vs";
    fsFilePath = "fragent.fs";

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

        if(vsUrl){
            var s = vsUrl.split('\/');
            vsFileName = s[s.length - 1];
            vsFilePath = vsUrl;
        }

         if(fsUrl){
            var s = fsUrl.split('\/');
            fsFileName = s[s.length - 1];
            fsFilePath = fsUrl;
        }
        
        reject = function(e){
            console.warn(e);
            console.warn("An error has occured with loading the shadering file.");
        };

        if(vsUrl && fsUrl){
            
            resolve = function(ts){
            
                webglSetup(ts[0], ts[1]);
            
            }
            
            loadFiles([vsUrl, fsUrl], resolve, reject);
        
        } else if(vsUrl){
            
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

                case "LAYOUT-COL":
                    dbgOpt.layoutCol = ce.getAttribute('value') || 1;

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
                
                if(!review){
                    review = new glsl_review(true, dbgOpt);
                }
                if(i==1){
                    review.addFile(fsFilePath, j, l);
                } else {
                    review.addFile(vsFilePath, j, l);
                }
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
