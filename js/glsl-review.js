var glsl_review = function(isShow = true, option = {}){

    /*
        fileName
        path
        tabElement
        viewElement
        status : 
    */

    var Instance = this;
    var fileList = [];
    
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


    var lE0 = getElementById('glsl-base-debug-container');
    var lEn = getElementById('glsl-base-debug-normalizer');
    var lEm = getElementById('glsl-base-debug-main');

    //var lEsList = document.getElementsByClassName('glsl-base-debug-files');
    var reviewCanvas = getElementById('review-canvas');
    var tabAriaParent = getElementById('top-tabs');
    var topBtnParent = getElementById('top-btns');
    var sepParent = getElementById('separator-parent');
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

        var lEs = createElement('div', `canvas-child-${id}`, ['glsl-base-debug-files']);

        // # TODO 外側の margin-left + margin-right = 20 計算でだしたい 
        var wid = (window.innerWidth - 20) / layoutCol; 
        setStyleElement(lEs, 'width', `${wid}px`);
        
        lEsList.push(lEs);
        reviewCanvas.appendChild(lEs);

        var tabAria = createElement('ul', '', ['tabs-ul']);
        tabAriaList.push(tabAria);
        //setStyleElement(tabAria, 'width', `${100/layoutCol}%`);
        setStyleElement(tabAria, 'width', `${wid}px`);

        if(id < layoutCol - 1){
          
            // separaor            
            (function(canvasId){
                var separator = createElement('div', '', ['separator']);
                //setStyleElement(separator, 'left', `${100/layoutCol*(id+1)}%`);
                setStyleElement(separator, 'left', `${wid * (id+1)}px`);
                separatorList.push(separator);
                sepParent.appendChild(separator);

                var mmove = function(e){
                    var p = (e.clientX - lEsList[canvasId ].getBoundingClientRect().left);
                    //p = p/reviewCanvas.offsetWidth*100.0;
                    if(canvasId == layoutCol -2)
                        var p2 =  (styleData.reviewCanvas.left + reviewCanvas.offsetWidth - e.clientX); // 要計算
                    else
                        var p2 =  (lEsList[canvasId +2].getBoundingClientRect().left - e.clientX); // 要計算
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
                    setStyleElement(lEsList[canvasId], 'width', `${p}px`);
                    //setStyleElement(tabAriaList[canvasId], 'width', `${p}%`);
                    setStyleElement(tabAriaList[canvasId], 'width', `${p}px`);
                    //setStyleElement(lEsList[canvasId + 1], 'width', `${p2}%`);
                    setStyleElement(lEsList[canvasId + 1], 'width', `${p2}px`);
                    //setStyleElement(tabAriaList[canvasId + 1], 'width', `${p2}%`);
                    setStyleElement(tabAriaList[canvasId + 1], 'width', `${p2}px`);
                    return false;
                }

                var mouseup = function(e){
                    document.removeEventListener('mousemove', mmove, false);
                    document.removeEventListener('mouseup', mouseup, false);
                    //setStyleElement(separator, 'left', `${e.clientX - reviewCanvas.getBoundingClientRect().left - 2}px`);
                    setStyleElement(separator, 'left', `${lEsList[canvasId+1].getBoundingClientRect().left - styleData.reviewCanvas.left - 2}px`);
                    setStyleElement(reviewCanvas, 'cursor', '');
                    removeClassElement(reviewCanvas, 'no-user-select');


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
                    setStyleElement(reviewCanvas, 'cursor', 'e-resize');
                    addClassElement(reviewCanvas, 'no-user-select');
                   
                });

            })(id);

        }

        tabAriaParent.appendChild(tabAria);
    } 

    showElement(lE0);
    getStyleData();
    console.log(styleData);

    if(isShow)
        showElement(lE0);
    else
        hideElement(lE0);




    // top btns
    
    var fileBtn = getElementById('file-btn');
    /*
    fileBtn.addEventListener('click', function(){
        console.log('fileBtn');
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent('click', true, true ); // event type, bubbling, cancelable
       return fselect.dispatchEvent(evt);
    });
    */

    var fselect = getElementById('file-select');

    fselect.onmouseover = function(){
        addClassElement(fileBtn, 'hover');
    };

    fselect.onmouseout = function(){
        removeClassElement(fileBtn, 'hover');
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
                        var span = document.createElement('span');
                        var elem = createElement('div', '', ['glsl-base-debug']);
                        elem.innerHTML = ['<img class="thumb" src="', e.target.result,
                                        '" title="', escape(theFile.name), '"/>'].join('');
                        addFileAndtab(theFile.name, elem);
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

    getElementById('minimize-btn').addEventListener('click', function(e){
        hideElement(lEm);
        showElement(lEn);
    });
      
    lEn.addEventListener('click', function(){
        showElement(lEm);
        hideElement(lEn);
    });

        
    // needed dialog elements
    var errContentElement = createElement('div', '', ['err-content']);
    hideElement(errContentElement);
    document.body.appendChild(errContentElement);

    var pathIndicatorDialog = createElement('div', '', ['path-indicator-dialog']);
    hideElement(pathIndicatorDialog);
    document.body.appendChild(pathIndicatorDialog);

    // i: number, j: lines, l: log
    //this.addFile = function(i, j, l){
    this.addFile = function(filePath, j, l = ""){

        var fileId = getNextFileId();

        var errorIndexList = [];
       
        //var lE = b('glsl-base-debug');
        var lE = createElement('div', '', ['glsl-base-debug'])

        //lE.textContent = errorLines;

        var errorLines = l.split('\n');
        var lines = j.split("\n");
        var ppe, pe, cp1, cp2, c1, c2;
          
        ppe = createElement('p', '', ['code-line']);
        cp1 = createElement('pre', '', ['line-number']);          
        cp2 = createElement('pre', '', ['line-content']);                    
       

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
        
            pe = ppe.cloneNode();
            pe.textContent = errorLines[index];
            lE.appendChild(pe);
        }

        var errHead = 0;
        var errorNum = errorIndexList.length;

        var hlStatus = {isComment : false};
        for(var index = 0; index < lines.length; index++){
            pe = ppe.cloneNode();
            c1 = cp1.cloneNode();
            c2 = cp2.cloneNode();
            c1.textContent = index + 1;

            c2.innerHTML =  highLightOneLine(lines[index], fileId, hlStatus);

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
                        showElement(errContentElement);
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

        // スクロール性能向上
        scrollPerformance(lE);

        var fileId = addFileAndtab(filePath, lE);
       
        var activeWordElem;

        // 宣言へジャンプ機能
        lE.addEventListener('dblclick', function(e){
            
            activeWordElem = null;
            var elm = document.elementFromPoint(e.clientX, e.clientY);
            var tgClass = getStructClass(elm.textContent, fileId);
            var cs = document.getElementsByClassName(tgClass);
            
            if(cs.length == 0)
                return false;

            for(var id=cs.length - 1; id >= 0; id--){
                if(cs[id].getBoundingClientRect().top - e.clientY < 0){
                    activeWordElem = cs[id];
                    break;
                }
            }

            if(!activeWordElem)
                return false;
            
            var tp =  activeWordElem.getBoundingClientRect().top - window.innerHeight / 2 ;
            lE.scrollTop  += tp;
            //rangeWord(cs[0]);
            activeWordElem.classList.add('active-word');

            return false;
        });

        lE.addEventListener('click', function(e){
            if(activeWordElem){
                activeWordElem.classList.remove('active-word');
                activeWordElem = null;
            }
        });
        
        // 最初のエラーラインにスクロール
        (function(){
            if(!firstErrorLineElement)
                return;

            var sc = 0;
            var top = firstErrorLineElement.getBoundingClientRect().top - window.innerHeight / 2;
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
        var tabElement = createElement('li', '', ['file-tab']);
        
        // tab-name element
        var tabC1 = createElement('span', '', ['file-tab-name']);
        tabC1.textContent = fileName;

          // tab close element
        var tabC2 = createElement('span', '', ['file-tab-close-btn']);
        tabC2.textContent = '×';

        tabElement.appendChild(tabC1);
        tabElement.appendChild(tabC2);

        var fileId = addFileList(fileName, path, tabElement, viewElement, status, canvasId);
        
        // hover 時にpath名表示
        (function setPathIndicatorListener(tab, tabElement){
            var isHovering = false;
            var requiredHoveringTime = 1000;
            tab.onmouseover = function(e){
                isHovering = true;
                setTimeout(function(){
                    if(hasClassElement(tabElement, 'dragging-tab')){
                        isHovering = false;
                        return;
                    }
                    if(isHovering){
                        setPositionElement(pathIndicatorDialog, e.clientX + 30, e.clientY);
                        pathIndicatorDialog.textContent = path;
                        showElement(pathIndicatorDialog);
                    }
                }, requiredHoveringTime);
            }

            tab.onmouseout = function(e){
                isHovering = false; 
                hideElement(pathIndicatorDialog);            
            }
        })(tabC1, tabElement);

        // ドラッグ
        (function setDragTabListener(tabC, tabElement, tabParent){

            var isDragging = false;
            var tabDragOffsetTop = 0;
            var tabDragOffsetLeft = 0;
            
            function tabDrag(e){
                
                if(!isDragging ){

                    tabParent.removeChild(tabElement);
                    lEm.appendChild(tabElement); 

                    isDragging = true;
                    
                    addClassElement(tabElement, 'dragging-tab');
                    addClassElement(reviewCanvas, 'no-user-select');

                }

                setPositionElement(tabElement, 
                    e.clientX - styleData.container.left - tabDragOffsetLeft, 
                    e.clientY - styleData.container.top - tabDragOffsetTop);
            }

            function tabDragEnd(e){
                document.removeEventListener('mousemove', tabDrag, false);
                document.removeEventListener('mouseup', tabDragEnd, false);

                if(!isDragging)
                    return false;

                isDragging = false;

                removeClassElement(reviewCanvas, 'no-user-select');
                removeClassElement(tabElement, 'dragging-tab');
                lEm.removeChild(tabElement);
                tabParent.appendChild(tabElement);
                // 別タブ
                if(e.offsetY - styleData.topBtns.height > 0){
                    window.open(location.href + '?a=3', 'sasacas, "resizable=no,scrollbars=yes,status=no"');
                    changeFileStatus(fileId, FILE_STATUS.CLOSE);
                } else {

                }
            }

            tabC.addEventListener('mousedown', function(e){
                
                document.addEventListener('mousemove', tabDrag, false);
                document.addEventListener('mouseup', tabDragEnd, false);

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
        addIdElement(tabElement, tabId);

        tabC1.addEventListener('click', function(){

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
            if(smallestNum > lEsList[id].childNodes.length){
                smallestNum = lEsList[id].childNodes.length;
                smallestId = id;
            }
        }
        lEsList[smallestId].appendChild(elem);
        return smallestId;

    }

    function addFileList( fileName, path, tabElement, viewElement, status, canvasId = 0){
        var fileData = {
            fileName: fileName,
            path: path,
            tabElement: tabElement,
            viewElement: viewElement,
            status: status,
            canvasId: canvasId
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
                addClassElement(fileData.tabElement, 'active-tab');
                showElement(fileData.tabElement, 'flex');
                showElement(fileData.viewElement);
                break;

            case FILE_STATUS.HIDE:
                removeClassElement(fileData.tabElement, 'active-tab');
                //hideElement(fileData.tabElement);
                hideElement(fileData.viewElement);
                break;

            case FILE_STATUS.CLOSE:
                removeClassElement(fileData.tabElement, 'active-tab');
                hideElement(fileData.tabElement);
                hideElement(fileData.viewElement);
                break;
        }

        fileData.status = status;

    }

    /* cursor */
    function setCursorListener(){
        cursorX = 20;
        cursorY = 20;
        cursorElement = getElementById('cursor');
        var fontVSpan = 14; // Y
        var fontHolSpan = 6; // X

        // key inputs # TODO pcのみにしたい
        document.addEventListener("keydown", function( event ) {
            switch( event.keyCode ) {
                // left
                case 37:
                case 65:
                    cursorX -= fontHolSpan;
                    break;
                 // right
                case 39:
                case 68:
                    cursorX += fontHolSpan;
                  break;
                // up
                case 38:
                case 87:
                    cursorY -= fontVSpan;
                  break;
                // down
                case 40:
                case 83:
                    cursorY += fontVSpan;
                  break;
                // space
                case 32:
                    break;
            }
            removeClassElement(cursorElement, 'blinking');
            setPositionElement(cursorElement, cursorX, cursorY);
            addClassElement(cursorElement, 'blinking');
            return false;
        });
    }

    /* scroll パフォーマンス向上
        画面上のみ表示する
        これにより600行のスクリプトの update layer tree の1サイクルあたりの時間が
        200ms から　50ms ほどに改善
        # TODO 自動スクロールが利かなくなった
        # TODO 幅方向のスクロール
     */
    function scrollPerformance(lE){
        //return;
        var ticking = false, allShowState = 0;
        var lEchildrenLength = lE.childNodes.length;
        var showLineNum = 40;
        
        //addClassElement(lE, 'scroll-performance');
        var start = 0;
        var end = showLineNum;

        var maxId = showLineNum < lEchildrenLength ? showLineNum : lEchildrenLength;
        for(var id=0; id < maxId; id++){
            addClassElement(lE.childNodes[id], 'show');
        }
        
        lE.addEventListener('scroll', function(e) {
          var sY = lE.scrollTop;
            if (!ticking) {
                addClassElement(lE, 'scroll-performance');

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
                    
                   // console.log(startId + ' ' + endId + ' ' + start + ' ' + end);
                    var minId = start > startId ? startId : start;
                    var maxId = end > endId ? end : endId;

                    for(var id = minId; id< maxId; id++){
                        var child = lE.childNodes[id];
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
                            addClassElement(lE.childNodes[id], 'show');
                        else if(action == -1)
                            removeClassElement(lE.childNodes[id], 'show');
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

        var containerStyle = lE0.getBoundingClientRect();
        styleData["container"] = {
            'left' : containerStyle.left,
            'top': containerStyle.top
        };


        styleData['topBtns'] = {
            'width': topBtnParent.offsetWidth,
            'height': topBtnParent.offsetHeight
        };

        styleData['topTbs'] = {

        };

        var reviewCanvasStyle = reviewCanvas.getBoundingClientRect();
        styleData['reviewCanvas'] = {
            'left': reviewCanvasStyle.left,
            'width': reviewCanvas.offsetWidth
        };
    }

    /* dom操作系 */
    function showElement(elem, s = 'block'){
        elem.style.display = s;             
    }

    function hideElement(elem){
        elem.style.display = 'none';
    }

    function setStyleElement(elem, s1, s2){
        elem.style[s1] = s2;
    }

    function setPositionElement(elem, x, y){
        setStyleElement(elem, 'left', `${x}px`);
        setStyleElement(elem, 'top', `${y}px`);
    }

    function addClassElement(elem, _class){
        elem.classList.add(_class);
    }

    function removeClassElement(elem, _class){
        elem.classList.remove(_class);
    }

    function addIdElement(elem, id){
        elem.setAttribute('id', id);
    }

    function getElementById(id){
        return document.getElementById(id);
    }

    function createElement(tag, id, classes){
        var elem = document.createElement(tag);
        if(id)
            addIdElement(elem, id);

        for(var i in classes){
            addClassElement(elem, classes[i]);
        }

        return elem;
    }

    function hasClassElement (elem, _class){
        return elem.classList.contains(_class);
    }

}