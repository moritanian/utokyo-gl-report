/*
  glsl base script 
  this script is forked from http://qiita.com/doxas/items/000f2ad6f82c27bd389e
*/
// オンロードイベントがエントリポイント
window.onload = function(){
  // 変数宣言
  var a, b, c, d, e, f, g, h, m, p, t, u, v, w, x, y, z;

  // document.getElementByIdをローカル変数に
  b = function(s){return document.getElementById(s)};

  // ウィンドウオブジェクト
  w = window;

  // ESCキーで描画を止めるためのイベントハンドラ
  w.addEventListener('keydown', k, true);

  // HTMLドキュメント内のcanvasへの参照
  c = b('c');

  // WebGLコンテキストの取得
  g = c.getContext('webgl');

  // プログラムオブジェクトの生成
  p = g.createProgram();

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

    // ログをリターン
    return g.getShaderInfoLog(k);
  }

  // シェーダのコンパイルとリンク
  if(!h(0, b('vs').text) && !h(1, b('fs').text)){g.linkProgram(p);}

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
  m = [0, 0];
  var mS = 500.0;
  document.addEventListener("mousemove", e => {m[0] = e.clientX/mS; m[1] = - e.clientY/mS;});
  //document.addEventListener("mousemove", e => {m[0] = e.clientX - m[0]; m[1] = e.clientY - m[1];});


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

  // 無名関数でメインルーチンを実行
  function render(){
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
  };
  render();

  // keydownに登録する関数
  function k(h){e = (h.keyCode !== 27);}
};