/*
    ファイルreview機能

    # TODO
    - リサイズ
    - tab移動
    - 新規ウィンドウ

    canvasFiledの子要素の幅をリストで保持するようにする
    そのデータをもとにリサイズ、tab移動機能実装予定

*/

var glsl_review = function(isShow = true, option = {}){

    /*
        fileName
        path
        tabElement
        viewElement
        status :
        fileId 
    */

    var Instance = this;
    var fileList = [];

    var IS_SCROLL_PERFORMANCE_UP = true;

      /* strage access */
    var viewStorage = {
        getNewWinName: function(){
            return 'newWinName'; // # TODO unique or strageで管理
        },

        setFileData: function(filePath, fileId, content, err){
            this._setObj(`file-${fileId}`, {content: content, type: 'text', err: err, filePath: filePath});

        },

        getFileData: function(fileId) {
            return this._getObj(`file-${fileId}`);
        },

        setOpenWinData: function(fileIds, winName){
            this._setObj(`win-data-${winName}`, {fileIds: fileIds});
        },

        getOpenWinData: function(winName){
            var winData = this._getObj(`win-data-${winName}`);
            return winData;
        },

        setLastViewData: function(){
            this._setObj('lastViewData', {fileList: fileList});
        },

        getLastViewData: function(){
            return this._getObj('lastViewData');
        },

        _setObj: function(key, obj){
            localStorage.setItem(key, (JSON.stringify(obj)));
        },

        _getObj: function(key){
            return JSON.parse(localStorage.getItem(key));
        }
    };
    
    var userStructs = {};


    const FILE_STATUS = {
        SHOW: 'show',
        HIDE: 'hide',
        CLOSE: 'close'
    };

    var highLigts = {
        'hl-val-type': ['bool', 'int', 'float', 'vec2', 'vec3', 'vec4', 
          'struct', 'void', 'bvec2', 'bvec3', 'bvec4', 'ivec2', 'ivec3', 
          'ivec4', 'mat2', 'mat3', 'mat4', 'sampler2D', 'samplerCube',
          'highp', 'mediump', 'lowp'],
        'hl-attribute': ['in', 'inout', 'out', 'uniform', 'varying', 'const'],
        'hl-operator': ['+', '-', '*', '/', '||', '|', '&&', '&', '=', 
          '<', '>', '<=', '>=', '==', '!'],
        'hl-bracket' : ['(', ')', '{', '}', '[', ']', ';', '.', ','],
        'hl-conditional-operator': ['if', 'return', 'else', 'while', 'for', 'break'],
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
    const hlPrimitiveVal = 'hl-primitive-val';

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

    var lE0 = _$_('#glsl-base-debug-container');
    var lEn = _$_('#glsl-base-debug-normalizer');
    var lEm = _$_('#glsl-base-debug-main');


    var reviewCanvas = _$_('#review-canvas');
    var tabAriaParent = _$_('#top-tabs');
    var topBtnParent = _$_('#top-btns');
    var sepParent = _$_('#separator-parent');
    var layoutCol = option.layoutCol || 1;

    var separatorList = [];
    var lEsList = []; // ファイルビューエリアのリスト(カラム数の要素)
    var tabAriaList = []; // tabエリアのリスト(カラム数の要素)

    var styleData = {
        "container": {},
        "topBtns" : {},
        "topTbs" : {},
        "reviewCanvas": {}
    };

    var cursorElement, cursorX, cursorY;
    setCursorListener();

    var catchupEvent = function(e){
        console.log(e);
        return false;

    }

    // drag対策 # TODO ずっとはつどうしたくない
    document.ondragend = function(){
        return false;
    };

    document.ondragstart = function(){
        return false;
    };
    
    for(var id=0; id<layoutCol; id++){

        var lEs = _$_.create('div', `canvas-child-${id}`, ['glsl-base-debug-files']);

        // # TODO 外側の margin-left + margin-right = 20 計算でだしたい 
        var wid = (window.innerWidth - 20) / layoutCol; 
        lEs.width = wid;
        
        lEsList.push(lEs);
        reviewCanvas.appendChild(lEs);

        var tabAria = _$_.create('ul', '', ['tabs-ul']);
        tabAriaList.push(tabAria);
        //setStyleElement(tabAria, 'width', `${100/layoutCol}%`);
        tabAria.width = wid;

        if(id < layoutCol - 1){
          
            // separaor            
            (function(canvasId){
                var separator = _$_.create('div', '', ['separator']);
                //setStyleElement(separator, 'left', `${100/layoutCol*(id+1)}%`);
                //separator.left = wid * (id + 1);
                separator.position(wid * (id + 1));
                separatorList.push(separator);

                sepParent.appendChild(separator);

                var mmove = function(e){
                    var p = (e.clientX - lEsList[canvasId ].offset().left);
                    //p = p/reviewCanvas.offsetWidth*100.0;
                    if(canvasId == layoutCol -2){
                        var p2 =  (styleData.reviewCanvas.left + reviewCanvas.innerWidth() - e.clientX); // 要計算
                    } else {
                        var p2 =  (lEsList[canvasId +2].offset().left - e.clientX); // 要計算
                    }
                    //p2 = p2/reviewCanvas.offsetWidth*100.0;


                    var minWid = 20;
                    if(p < minWid){
                        p2 -= minWid - p;
                        p = minWid;
                        
                    }
                    if(p2 < minWid){
                        p -= minWid - p2;
                        p2 = minWid;
                    }

                    //setStyleElement(lEsList[canvasId], 'width', `${p}%`);
                    lEsList[canvasId].width = p;
                    //setStyleElement(tabAriaList[canvasId], 'width', `${p}%`);
                    tabAriaList[canvasId].width = p;
                    //setStyleElement(lEsList[canvasId + 1], 'width', `${p2}%`);
                    lEsList[canvasId + 1].width = p2;
                    //setStyleElement(tabAriaList[canvasId + 1], 'width', `${p2}%`);
                    tabAriaList[canvasId + 1].width = p2;
                    return false;
                }

                var mouseup = function(e){
                    document.removeEventListener('mousemove', mmove, false);
                    document.removeEventListener('mouseup', mouseup, false);
                    //setStyleElement(separator, 'left', `${e.clientX - reviewCanvas.getBoundingClientRect().left - 2}px`);
                    
                    separator.css('left', `${lEsList[canvasId+1].offset().left - styleData.reviewCanvas.left - 2}px`);
                    reviewCanvas.css('cursor', '');
                    reviewCanvas.removeClass('no-user-select');


                    /*
                     これはうまくいかない
                     // drag対策
                    document.removeEventListener('dragstart', catchupEvent, true);
                    document.removeEventListener('dragend', catchupEvent, true);
                    */
                    return true;
                }
                

                separator.addEventListener('mousedown', function(e){
                     /*
                     // drag対策
                    // これはうまくいかない
                    document.addEventListener('dragstart', catchupEvent, true);
                    document.addEventListener('dragend', catchupEvent, true);
                        */

                    document.addEventListener('mousemove', mmove, false);
                    document.addEventListener('mouseup', mouseup, false);
                    reviewCanvas.css('cursor', 'e-resize');
                    reviewCanvas.addClass('no-user-select');
                   
                });

            })(id);

        }

        tabAriaParent.appendChild(tabAria);
    } 

    lE0.show();
    getStyleData();

    if(isShow)
        lE0.show();
    else
        lE0.hide();

    // top btns  
    var fileBtn = _$_('#file-btn');
    /*
    fileBtn.addEventListener('click', function(){
        console.log('fileBtn');
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent('click', true, true ); // event type, bubbling, cancelable
       return fselect.dispatchEvent(evt);
    });
    */

    var fselect = _$_('#file-select');

    fselect.mouseover(function(){
        fileBtn.addClass('hover');
    });

    fselect.mouseout(function(){
        fileBtn.removeClass('hover');
    });

    var folderBtn = _$_('#folder-btn');
   
    var folderselect = _$_('#folder-select');

    folderselect.mouseover(function(){
        folderBtn.addClass('hover');
    });

    folderselect.mouseout(function(){
        folderBtn.removeClass('hover');
    });

    var viewBtn = _$_('#view-btn');
    var viewDpParent = _$_('#view-dp-parent');

    viewBtn.click(function(){
        viewDpParent.show();
    });
    viewBtn.mouseleave(function(){
        viewDpParent.hide();
    });

    var layoutBtn = _$_('#layout-btn');
    var layoutDpParent = _$_('#layout-dp-parent');

    var layoutBtnHoveringFlg = false;
    layoutBtn.mouseover(function(){

        layoutBtnHoveringFlg = true;
        
        setTimeout(function(){
            if(layoutBtnHoveringFlg){
                layoutDpParent.show();
            }
        }, 500);

    }).mouseleave( function(){
        layoutBtnHoveringFlg = false;
        layoutDpParent.hide();
    });

    var layoutChildrenBtns = document.getElementsByClassName('layout-btn-child');
    for(var i=0; i<layoutChildrenBtns.length; i++){
        layoutChildrenBtns[i].addEventListener('click', function(){
            var col = _$_(this).attr('col');
            console.log(col);
            layoutDpParent.hide();
        })  
    }
    

    /*
    fselect.addEventListener('click', function(evt){
        return true;
    });*/

    fselect.addEventListener('change', function(evt){

        var files = evt.target.files; // FileList object

        for (var i = 0, f; f = files[i]; i++) {
            // Only process image files.
            var isImage = f.type.match('image.*');

            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function(theFile) {

                if(isImage){

                    return function(e) {
                        // Render thumbnail.
                        Instance.addImageFile(theFile.name, e.target.result);

                    };

                } else {

                    return function(e){
                        Instance.addFile(theFile.name, e.target.result);
                        //addFileAndtab(theFile.name, elem);
                    }
                }

            })(f);

            // Read in the image file as a data URL.
            if(isImage)
                reader.readAsDataURL(f);
            else {
                reader.readAsText(f, 'utf8'); 
                //reader.readAsBinaryString(f); 
            }
        }
    }, false);

    _$_('#minimize-btn').click(function(){    
        lEm.hide();
        lEn.show();
    });
      
    lEn.click(function(){
        lEm.show();
        lEn.hide();
    });

        
    // needed dialog elements
    //var errContentElement = createElement('div', '', ['err-content']);
    var errContentElement = _$_.create('div', '', ['err-content']);
    
    errContentElement.hide();
    _$_('body').appendChild(errContentElement);

    var pathIndicatorDialog = _$_.create('div', '', ['path-indicator-dialog']);
    pathIndicatorDialog.hide();
    _$_('body').appendChild(pathIndicatorDialog);

    // i: number, j: lines, l: log
    //this.addFile = function(i, j, l){
    this.addFile = function(filePath, j, l = "", isStorageSave = true){

        var fileId = getNextFileId();

        var errorIndexList = [];

        if(isStorageSave)
            viewStorage.setFileData(filePath, fileId, j, l);
       
        //var lE = b('glsl-base-debug');
        var lE = _$_.create('code', '', ['glsl-base-debug']);

        //lE.textContent = errorLines;

        var errorLines = [];
        if(l)
            errorLines = l.split('\n');

        var lines = j.split("\n");
        var ppe, pe, cp1, cp2, c1, c2;
          
        ppe = _$_.create('p', '', ['code-line']);
        cp1 = _$_.create('pre', '', ['line-number']);          
        cp2 = _$_.create('pre', '', ['line-content']);   

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

            }
        
            pe = ppe.clone();
            pe.text(errorLines[index]);
            pe.addClass('error-text');
            lE.appendChild(pe);
        }

        var errHead = 0;
        var errorNum = errorIndexList.length;

        var maxLetterNumInLine = 0;
        var hlStatus = {isComment : false};

        for(var index = 0; index < lines.length; index++){
            pe = ppe.clone();
            c1 = cp1.clone();
            c2 = cp2.clone();
            c1.text(index + 1);

            c2.html(highLightOneLine(lines[index], fileId, hlStatus));

            //c2.textContent = lines[index];
            pe.appendChild(c1);
            pe.appendChild(c2);
            
            if(errorNum > 0  && errorIndexList[errHead]["row"] === index + 1){
                pe.addClass('error-line');

                (function(){
                    
                    var ei = errHead;
                    
                    pe.hover(function(e){
                        errContentElement.text(errorIndexList[ei]["contents"][0]);
                        errContentElement.position( e.clientX + 40 ,  e.clientY - 40 );
                        this.classList.add('hover-line');
                        errContentElement.show();
                    }, function(){
                        errContentElement.hide();
                        this.classList.remove('hover-line');
                    });
                })();
              
                if(errHead + 1 < errorNum ){
                    errHead +=1;
                }
              
                if(!firstErrorLineElement){
                    firstErrorLineElement = pe;
                }

            }

            if(maxLetterNumInLine < lines[index].length){
                maxLetterNumInLine = lines[index].length;
            }
        
            pe.css('min-width', lines[index].length * 6 + 100 + 'px');

            lE.appendChild(pe);
            
        }

        // スクロール性能向上
        if(IS_SCROLL_PERFORMANCE_UP)
            scrollPerformance(lE);

        var fileId = addFileAndtab(filePath, lE);
       
        var activeWordElem;

        // 宣言へジャンプ機能
        lE.addEventListener('dblclick', function(e){
            
            activeWordElem = null;
            var elm = document.elementFromPoint(e.clientX, e.clientY);
            var tgClass = getStructClass(elm.textContent, fileId);
            var cs = document.getElementsByClassName(tgClass);
            
            var wordElemTop;
            
            if(cs.length == 0)
                return false;

            if(IS_SCROLL_PERFORMANCE_UP)
                lE.removeClass('scroll-performance');

            for(var id=cs.length - 1; id >= 0; id--){

                wordElemTop = cs[id].getBoundingClientRect().top;
                if(wordElemTop - e.clientY < 0){
                    activeWordElem = _$_(cs[id]);
                    break;
                }
            }

            if(IS_SCROLL_PERFORMANCE_UP){
                lE.addClass('scroll-performance');
            }
               

            if(!activeWordElem)
                return false;
            
            var tp =  wordElemTop - window.innerHeight / 2 ;

            lE.scrollTop  += tp;
            //rangeWord(cs[0]);
            activeWordElem.addClass('active-word');

            return false;
        });

        lE.click(function(e){
            if(activeWordElem){
                activeWordElem.removeClass('active-word');
                activeWordElem = null;
            }
        });
        
        // 最初のエラーラインにスクロール
        (function(){
            if(!firstErrorLineElement)
                return;

            var sc = 0;
            var top = firstErrorLineElement.offset().top - window.innerHeight / 2;
            var st = 0.05;
            var t = 0.3;
            
            (function scrollToErrorLine(){
                if(sc < top)
                    setTimeout(scrollToErrorLine, st * 1000);

                lE.scrollTop = sc;
                sc += top * st / t;
            })();
        })();

        return fileId;
    }

    this.addImageFile = function(filePath, fileData, isStorageSave = true){
        var span = _$_.create('span');

        var elem = _$_.create('div', '', ['glsl-base-debug']);
        elem.html(['<img class="thumb" src="', fileData,
                                        '" title="', escape(filePath), '"/>'].join(''));
        var fileId = addFileAndtab(filePath, elem);

        if(isStorageSave)
            viewStorage.setFileData(filePath, fileId, fileData);

    }

    this.recoverLastView = function(){
        var lastViewData = viewStorage.getLastViewData();
        
        if(!lastViewData || !lastViewData.fileList)
            return false;

        for(var i = 0; i < lastViewData.fileList.length; i++){

            var _fileInfo = lastViewData.fileList[i];
            var fileData = viewStorage.getFileData(_fileInfo.fileId);
            console.log(_fileInfo);
            
            if(fileData && _fileInfo.status != FILE_STATUS.CLOSE){
                var filePath = fileData.filePath;
                var s = filePath.split(/\./);
                if(s[s.length - 1] === 'png' || s[s.length - 1] === 'jpg') 
                    this.addImageFile(fileData.filePath, fileData.content);
                else 
                    this.addFile(fileData.filePath, fileData.content, fileData.err, false);
            }
        }
    }

     // winName
    if(option.winName && option.winName !== ""){
        var fileIds = viewStorage.getOpenWinData(option.winName);
        console.log(fileIds);

        for(var i in fileIds){
        
            var fileId = fileIds[i];
            var fileData = viewStorage.getFileData(fileId);
            if(fileData){
                var s = fileData.filePath.split(/\./);
                if(s[s.length - 1] === 'png' || s[s.length - 1] === 'jpg') 
                    this.addImageFile(fileData.filePath, fileData.content);
                else
                    this.addFile(fileData.filePath, fileData.content, fileData.err, false);

            }
        
        }
    }

    window.onbeforeunload = function(event){
        viewStorage.setLastViewData();
        //event.returnValue = "終了してよろしいですか？" ;
    }


    /* highligh まわり */

    function getStructClass(sName, fileId){
        return `hl-${fileId}-struct-${sName}`;
    }
      
        
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

    function highLightOneLine(line, fileId,  status = {}){
        
        var innerHTML = "", comment = "";
        
        // #defineとか
        if(line !== "" && line[0] === "#"){
            var es = line.split(" ");
            var _class = hlSharp;
            if(es[0] === "#define"){
                _class = [_class, getStructClass(es[1], fileId)];
            }
            return getHighLightSpan(line, _class);
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
              
                innerHTML += _highLightOneLine(wd, fileId);
              
            }
        }

        return innerHTML + (comment !== "" ? getHighLightSpan(comment, hlComment) : "");
    }

    function _highLightOneLine(line, fileId){
        
        var comment = "";
        var m = line.split(/(\/\/)/);
        var codeline = m[0];
        
        // コメントアウトの部分をつなぎ合わせる #TODO もっといい方法ありそう
        for (id = 1; id < m.length; id++){
            comment += m[id];
        }

        var words = codeline.split(patterForLineSplit);

        return highLightWordsInLine(words, comment, fileId);
    }

    function highLightWordsInLine(words, comment, fileId){
        var isNextStructName = false;
        var isNextValName = false;
        var isNumber = false;
        var integerNum = 0;
        var  innerHTML = "";
        
        for(var wi in words){

            var word = words[wi];
          
            if(word === "")
                continue;
          
            // tab
            if(word == "\t"){
                innerHTML += option.tab;

            } else if(word === " "){
          
                innerHTML += " ";
          
            } else {
            
                // 数値
                if(!isNaN(word)){

                    // 小数点以下
                    if(isNumber){
                        
                        innerHTML += getHighLightSpan((`${integerNum}${word}`), hlPrimitiveVal);
                        isNumber = false;
                        continue;
                    
                    // 整数
                    } else {

                        isNumber = true;
                        integerNum = word;
                        continue;
                    
                    }

                // 数値でない
                } else if(isNumber){

                    // 小数点
                    if(word === "."){
                    
                        integerNum += word;
                        continue;
                    
                    // 前の数値終了
                    } else {
                        innerHTML += getHighLightSpan(integerNum, hlPrimitiveVal);;
                        isNumber = false;
                    }
                    
                }

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
                        hl = [hl, getStructClass(word, fileId), hlUserStruct];
                        userStructs[word] = true;
                  
                    } else {
                  
                        hl = [hl, getStructClass(word, fileId)];
                  
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


    /* file 関係 */
    function addFileAndtab(path, viewElement, status = FILE_STATUS.SHOW){
        var canvasId = appendlEsList(viewElement);

        var s = path.split('\/');
        var fileName = s[s.length - 1];

        //var tabId = `${fileName.split(/\./)[0]}-`
        var tabElement = _$_.create('li', '', ['file-tab']);
        
        // tab-name element
        var tabC1 = _$_.create('span', '', ['file-tab-name']);
        tabC1.text(fileName);

          // tab close element
        var tabC2 = _$_.create('span', '', ['file-tab-close-btn']);
        tabC2.text('×');

        tabElement.appendChild(tabC1);
        tabElement.appendChild(tabC2);

        var fileId = addFileList(fileName, path, tabElement, viewElement, status, canvasId);
        

        // hover 時にpath名表示
        (function setPathIndicatorListener(tab, tabElement){
            var isHovering = false;
            var requiredHoveringTime = 1000;
            tab.mouseover(function(e){
                isHovering = true;
                setTimeout(function(){
                    if(tabElement.hasClass('dragging-tab')){
                        isHovering = false;
                        return;
                    }
                    if(isHovering){
                        pathIndicatorDialog.position( e.clientX + 30, e.clientY);
                        pathIndicatorDialog.text(path);
                        pathIndicatorDialog.show();
                    }
                }, requiredHoveringTime);
            });

            tab.mouseout(function(e){
                isHovering = false; 
                pathIndicatorDialog.hide();
            });

            tab.mousedown(function(e){
                isHovering = false;
                pathIndicatorDialog.hide();
                return true;
            });
        })(tabC1, tabElement);

        // ドラッグ
        (function setDragTabListener(tabC, tabElement, tabParent, fileId){
            var isDragging = false;
            var tabDragOffsetTop = 0;
            var tabDragOffsetLeft = 0;
            
            function tabDrag(e){
                if(e.movementX == 0 && e.movementY == 0)
                return;                
                if(!isDragging ){
                    tabParent.removeChild(tabElement);
                    lEm.appendChild(tabElement); 

                    isDragging = true;
                    
                    tabElement.addClass('dragging-tab');
                    reviewCanvas.addClass('no-user-select');

                }

                tabElement.position( 
                    e.clientX - styleData.container.left - tabDragOffsetLeft, 
                    e.clientY - styleData.container.top - tabDragOffsetTop);
            }

            function tabDragEnd(e){
                document.removeEventListener('mousemove', tabDrag, false);
                document.removeEventListener('mouseup', tabDragEnd, false);

                if(!isDragging)
                    return false;

                isDragging = false;

                reviewCanvas.removeClass('no-user-select');
                tabElement.removeClass('dragging-tab');

                lEm.removeChild(tabElement);
                tabParent.appendChild(tabElement);
                // 別タブ
                if(e.offsetY - styleData.topBtns.height > 0){
                   // window.open(location.href + '?a=3', 'sasacas, "resizable=no,scrollbars=yes,status=no"');
                    
                    var winName = viewStorage.getNewWinName();
                    viewStorage.setOpenWinData([fileId], winName);

                    //var newWin = window.open(`./GLSL_viewer.html`, winName, "resizable=no,scrollbars=yes,status=no");
                    var newWin = window.open(`./GLSL_viewer.html`, winName, "scrollbars=yes,status=no");
                    
                    newWin.focus();
                    changeFileStatus(fileId, FILE_STATUS.CLOSE);
                } else {

                }
            }

            tabC.mousedown(function(e){
                

                _$_(document).mousemove(tabDrag, false);
                _$_(document).mouseup(tabDragEnd, false);

                changeFileStatus(fileId, FILE_STATUS.SHOW);

                tabDragOffsetLeft = e.offsetX; 
                tabDragOffsetTop = e.offsetY + 7; 
            });


        })(tabC1, tabElement, tabAriaList[canvasId], fileId);

      
        // file close
        tabC2.addEventListener('click', function(){
            console.log(fileId);
            changeFileStatus(fileId, FILE_STATUS.CLOSE);
            //changeFileStatus(getNextFileId() - 1, FILE_STATUS.SHOW);
        });
        
        var tabId = `tab-file${fileId}`;
        tabElement.addId(tabId);

        // SHOW tab from HIDE
        tabC1.click(function(){

            changeFileStatus(fileId, FILE_STATUS.SHOW);

        });

        tabAriaList[canvasId].appendChild(tabElement);
        //Tbs.appendChild(tabElement);

        changeFileStatus(fileId, status);


        return fileId;

    }

    function appendlEsList(elem){
        var smallestId = 0, smallestNum = 1000;
        for(var id=0; id<lEsList.length; id++){
            if(smallestNum > lEsList[id].children().length){
                smallestNum = lEsList[id].children().length;
                smallestId = id;
            }
        }
        lEsList[smallestId].appendChild(elem);
        return smallestId;

    }

    function addFileList( fileName, path, tabElement, viewElement, status, canvasId = 0){

        // #TODO ユニークな値をふる
        var fileId = fileList.length + 1;

        var fileData = {
            fileName: fileName,
            path: path,
            tabElement: tabElement,
            viewElement: viewElement,
            status: status,
            canvasId: canvasId,
            fileId: fileId
        };

        return fileList.push(fileData);
    }

    function getNextFileId(){
        return fileList.length + 1;
    }

    function getFileData(id){
        return fileList[id - 1];
    }

    function changeFileStatus(fileId, status){

        var hasShowFile = false;
        var myCanvasId = getFileData(fileId).canvasId;

        for(var id= fileList.length; id > 0; id--){
            var fileData = getFileData(id);

            // 該当ファイル
            if( id == fileId){
                setOneFileStatus(fileId, status);
            
            // 別ファイル
            } else if(fileData.canvasId == myCanvasId){
                if(status == FILE_STATUS.SHOW){

                    if(fileData.status == FILE_STATUS.SHOW){
                        setOneFileStatus(id, FILE_STATUS.HIDE);
                    }

                } else {

                    if(hasShowFile) {

                        if(fileData.status == FILE_STATUS.SHOW)
                            setOneFileStatus(id, FILE_STATUS.HIDE);

                    } else if(fileData.status == FILE_STATUS.SHOW){
                        hasShowFile = true;
                    }else if(fileData.status == FILE_STATUS.HIDE){
                        console.log(id);
                        setOneFileStatus(id, FILE_STATUS.SHOW);
                        hasShowFile = true;
                    }
                }
            }
        }
    }

    function setOneFileStatus(id, status){
        
        var fileData = getFileData(id);

        switch(status){
            case FILE_STATUS.SHOW:
                fileData.tabElement.addClass('active-tab');
                fileData.tabElement.show('flex');
                fileData.viewElement.show();
                break;

            case FILE_STATUS.HIDE:
                fileData.tabElement.removeClass('active-tab');
                fileData.viewElement.hide();
                break;

            case FILE_STATUS.CLOSE:
                fileData.tabElement.removeClass('active-tab');
                fileData.tabElement.hide();
                fileData.viewElement.hide();
                break;
        }

        fileData.status = status;

    }

    /* cursor */
    function setCursorListener(){
        cursorX = 20;
        cursorY = 20;
        cursorElement = _$_('#cursor');
        var fontVSpan = 14; // Y
        var fontHolSpan = 6; // X

        // key inputs # TODO pcのみにしたい
        window.addEventListener("keydown", function( event ) {
            switch( event.keyCode ) {
                // left
                case 37:
                    cursorX -= fontHolSpan;
                    break;
                 // right
                case 39:
                    cursorX += fontHolSpan;
                  break;
                // up
                case 38:
                    cursorY -= fontVSpan;
                  break;
                // down
                case 40:
                    cursorY += fontVSpan;
                  break;
                // space
                case 32:
                    break;

                // m
                case 77:
                    if(event.ctrlKey){
                        Instance.addFile('untitled', '');
                        event.preventDefault(); 
                    }

                    break;
            }
            cursorElement.removeClass('blinking');
            cursorElement.position(cursorX, cursorY);
            cursorElement.addClass('blinking');
            return false;
        });
    }

    /* scroll パフォーマンス向上
        画面上のみ表示する
        これにより600行のスクリプトの update layer tree の1サイクルあたりの時間が
        200ms から　50ms ほどに改善
     */
    function scrollPerformance(lE){
        //return;
        var ticking = false, allShowState = 0;
        var lEchildrenLength = lE.children().length;
        var showLineNum = 40;
        
        lE.addClass('scroll-performance');
        var start = 0;

        var maxId = showLineNum < lEchildrenLength ? showLineNum : lEchildrenLength;
        var end = maxId;

        for(var id=0; id < maxId; id++){
            _$_(lE.children()[id]).addClass('show');
        }
        
        lE.addEventListener('scroll', function(e) {
          var sY = lE.scrollTop;
            if (!ticking) {
                
                //addClassElement(lE, 'scroll-performance');
                /*
                if(allShowState == 0){
                    
                    function check(){
                        if(allShowState == 1){
                            removeClassElement(lE, 'scroll-performance');
                            allShowState = 0;
                        } else if(allShowState == 2){
                            allShowState = 1;
                            setTimeout(check, 500);
                        }
                    }
                    allShowState = 2;
                    check();

                } else if(allShowState == 1){
                    allShowState = 2;
                }
*/
                window.requestAnimationFrame(function() {
                    //removeClassElement(lE, 'scroll-performance');

                    ticking = false;

                    //console.log(sY);
                    var startId = Math.ceil(sY / 15) - 1 ;
                    if(startId < 0)
                        startId = 0;
                    
                    var endId = startId + showLineNum;
                    if(endId > lEchildrenLength )
                        endId = lEchildrenLength;

                    if(start == startId && endId == end)
                        return;
                    
                    //console.log(startId + ' ' + endId + ' ' + start + ' ' + end);
                    var minId = start > startId ? startId : start;
                    var maxId = end > endId ? end : endId;

                    for(var id = minId; id< maxId; id++){
                        var child = lE.children(id);
                        //if(!child)
                        //    continue;
                        var action = 0;
                        if(end <= startId){
                            if(startId <= id && id < endId )
                                action = 1;
                            else if(start <= id && id < end)
                                action = -1;
                        } else if(endId <= start){
                            if(startId <= id && id < endId)
                                action = 1;
                            else if(start <= id && id < end)
                                action = -1;

                        } else if(startId <= id && id < start) {
                            action = 1;
                        } else if (end <= id && id < endId) {
                            action = 1;
                        } else if (start <= id && id < startId) {
                            action = -1;
                        } else if(endId <= id && id < end ) {
                            action = -1;
                        }
                        if(action == 1)
                            lE.children(id).addClass('show');
                        else if(action == -1)
                            lE.children(id).removeClass('show');
                    }

                    start = startId;
                    end = endId;

                });
            }
            ticking = true;

            return true;
        });
        
    }


    /* スタイルデータ取得 */
    function getStyleData () {

        var containerStyle = lE0.offset();
        styleData["container"] = {
            'left' : containerStyle.left,
            'top': containerStyle.top
        };

        styleData['topBtns'] = {
            'width': topBtnParent.innerWidth(),
            'height': topBtnParent.innerHeight()
        };

        styleData['topTbs'] = {

        };

        var reviewCanvasStyle = reviewCanvas.offset();
        styleData['reviewCanvas'] = {
            'left': reviewCanvasStyle.left,
            'width': reviewCanvas.innerWidth()
        };
    }

}
