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
    const SCROLL_CONTROLLER_KEY = Symbol('SCROLL_CONTROLLER_KEY');

    // file callback function keys
    const FILE_CALLBACK_KEYS = {
        RESIZE: Symbol('RESIZE'),
        TAB_DRAG_END: Symbol('TAB_DRAG_END')
    };

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
            this._setObj('lastViewData', {
                fileList: fileList,
                option: option
            });
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
    option.layoutCol = option.layoutCol || 1;

    var separatorList = [];
    var lEsList = []; // ファイルビューエリアのリスト(カラム数の要素)
    var tabAriaList = []; // tabエリアのリスト(カラム数の要素)

    // 計算でだしたい
    const TabSepWid = 2;
    const CanvasSepWid = 8; 
    var lineHeight = 15;

    var styleData = {
        "container": {},
        "topBtns" : {},
        "topTbs" : {},
        "reviewCanvas": {}
    };


    // i: number, j: lines, l: log
    //this.addFile = function(i, j, l){
    this.addFile = function(filePath, j, l = "", isStorageSave = true, canvasId = null, status = FILE_STATUS.SHOW){

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
            lE[SCROLL_CONTROLLER_KEY] = new ScrollController(lE);

        var fileId = addFileAndtab(filePath, lE, canvasId, status);
       
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

    this.addImageFile = function(filePath, fileData, isStorageSave = true, canvasId = null, status = FILE_STATUS.SHOW){

        var elem = _$_.create('div', '', ['glsl-base-debug']);
        
        var imgElem = _$_.create('img', '',['image-file']);

        var originalWidth = 0;
        var originalHeight = 0;

        function getOriginalSize(){
            
            imgElem.width = 'auto';
            originalWidth = imgElem.innerWidth();
            originalHeight = imgElem.innerHeight();
            imgElem.width = '';
        
        }

        imgElem.on('load', updateSizeDisplay);

        imgElem.attr('src', fileData);
        imgElem.attr('title', escape(filePath));

        var sizeDisplay  = _$_.create('div', '', ['image-size-display']);
        var sizeContent = _$_.create('span');
        var perContent = _$_.create('span', '', ['per-content']);
         
       

        // size と拡大率表示
        var sizeDisplayStatus = 0;
        function updateSizeDisplay(){

            if(originalHeight == 0 || originalWidth == 0)
                getOriginalSize();

            var sizePer = Math.ceil(imgElem.innerWidth()/ originalWidth * 100);
            sizeContent.text(`${originalWidth}px × ${originalHeight}px`);
            perContent.text(`${sizePer}%`);

            const Timeout = 1000;

            function timeoutFunc(){
            
                if(sizeDisplayStatus == 1){
            
                    sizeDisplay.hide();
                    sizeDisplayStatus = 0;    
                    
                } else if(sizeDisplayStatus == 2){
                       
                    sizeDisplayStatus = 1;

                    setTimeout(timeoutFunc, Timeout);

                }
            } 

            if(sizeDisplayStatus == 0){                     
            
                sizeDisplay.show();
                sizeDisplayStatus = 1;

                setTimeout(timeoutFunc, Timeout); 

            } else if(sizeDisplayStatus == 1){
                sizeDisplayStatus = 2;
            }
            
        }
       
        sizeDisplay.appendChild(sizeContent);
        sizeDisplay.appendChild(perContent);
        elem.appendChild(imgElem);
        elem.appendChild(sizeDisplay);

        var callback = {
            [FILE_CALLBACK_KEYS.RESIZE] : updateSizeDisplay,
            [FILE_CALLBACK_KEYS.TAB_DRAG_END] : updateSizeDisplay
        };

        var fileId = addFileAndtab(filePath, elem, canvasId, status, callback);

        if(isStorageSave)
            viewStorage.setFileData(filePath, fileId, fileData);


    }

    this.addPdfFile = function(filePath, fileData, isStorageSave = true, canvasId = null, status = FILE_STATUS.SHOW){
        //var elem = _$_.create('div', '', ['glsl-base-debug']);
        
        var iframe = _$_.create('iframe', '', ['pdf-frame'] );
        const ViewerSrc = './pdfjs-1.7.225-dist/web/viewer.html';
        var pdfSrc = 'http://localhost/CVwork/sample_files/sample.pdf';
        iframe.attr('src', `${ViewerSrc}?file=${pdfSrc}`);

        //elem.appendChild(iframe);

        var fileId = addFileAndtab(filePath, iframe, canvasId, status);

        if(isStorageSave)
            viewStorage.setFileData(filePath, fileId, fileData);

    }

    
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

    fselect.changeInput(function(fileName, fileData){
        Instance.addFile(fileName, fileData);
    }, function(fileName, fileData){
        Instance.addImageFile(fileName, fileData);
    }, function(fileName, fileData){
        Instance.addPdfFile(fileName, fileData);
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


    var toolBtn = _$_('#tool-btn');
    var toolDpParent = _$_('#tool-dp-parent');
    var backgroundWall = _$_('#back-wall');
    var backgroundSelect = _$_('#background-select');
    var backgroundOpacity = _$_('#background-opacity');
    var opacityBar = _$_('#opacity-range');
    var opacityBarInput = _$_('#opacity-range-input');

    toolBtn.click(function(){
        toolDpParent.show();
    });
    toolBtn.mouseleave(function(){
        toolDpParent.hide();
    });

    var setBackgroundImage = function(fileName, fileData){
        backgroundWall.css('background-image', `url(${fileData})`);
        backgroundWall.attr('title', escape(fileName));
        option.backgroundName = fileName;
        option.backgroundUrl = fileData;
        option.useBackgrounfLocalImage = true;
    }

    backgroundSelect.changeInput(function(){
    }, setBackgroundImage);

    backgroundOpacityHoverFlg = false;
    backgroundOpacity.mouseover(function(){
        backgroundOpacityHoverFlg = true;
        
        setTimeout(function(){
            if(backgroundOpacityHoverFlg){
                opacityBar.show();
            }
        }, 500);

    }).mouseleave(function(){
        backgroundOpacityHoverFlg = false;
        opacityBar.hide();
    });

    var setBackgroundOpacity = function(val){
        backgroundWall.css('opacity', val/ 100.0);
        option.backgroundOpacity = val;
        option.useBackgroundOpacity = true;
        opacityBarInput.val(val);
    };

    opacityBarInput.addEventListener('change', function(){
        setBackgroundOpacity( _$_(this).val());
    }).on('input', function(){
        setBackgroundOpacity( _$_(this).val());
    });


    if(option.recoverLastView){
        recoverLastOption();
    }

    initField();

   

    var layoutChildrenBtns = document.getElementsByClassName('layout-btn-child');
    for(var i=0; i<layoutChildrenBtns.length; i++){
        layoutChildrenBtns[i].addEventListener('click', function(){
            var col = _$_(this).attr('col');
            changeFiledLayoutCol(col); 
            layoutDpParent.hide();
        })  
    }
    
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

    if(option.recoverLastView){
        recoverLastFiles();
    }

    function recoverLastFiles() {

        var lastViewData = viewStorage.getLastViewData();
        
        if(!lastViewData )
            return false;

        if(lastViewData.fileList){

            for(var i = 0; i < lastViewData.fileList.length; i++){

                var _fileInfo = lastViewData.fileList[i];
                var fileData = viewStorage.getFileData(_fileInfo.fileId);
                console.log(_fileInfo.fileName);
                
                if(fileData && _fileInfo.status != FILE_STATUS.CLOSE){
                    var filePath = fileData.filePath;
                    var s = filePath.split(/\./);
                    var extension = s[s.length - 1];
                    if(extension === 'png' || extension === 'jpg') 
                        Instance.addImageFile(fileData.filePath, fileData.content, false, _fileInfo.canvasId, _fileInfo.status);
                    else if(extension === 'pdf')
                        Instance.addPdfFile(fileData.filePath, fileData.content, false, _fileInfo.canvasId, _fileInfo.status);
                    else 
                        Instance.addFile(fileData.filePath, fileData.content, fileData.err, false, _fileInfo.canvasId, _fileInfo.status);
                }
            }
        } 
    }

    function recoverLastOption() {
        
        var lastViewData = viewStorage.getLastViewData();
        
        if(!lastViewData )
            return false;

        if(lastViewData.option){
            
            if(lastViewData.option.layoutCol){
                option.layoutCol = lastViewData.option.layoutCol;
            }

            if(lastViewData.option.useBackgrounfLocalImage){

                option.useBackgrounfLocalImage = true;
                option.backgroundUrl = lastViewData.option.backgroundUrl;
                option.backgroundOpacity = lastViewData.option.backgroundOpacity;
                setBackgroundImage(option.backgroundName, option.backgroundUrl);

            }

            if(lastViewData.option.useBackgroundOpacity){

                option.useBackgroundOpacity = true;
                option.backgroundOpacity = lastViewData.option.backgroundOpacity;
                setBackgroundOpacity(option.backgroundOpacity);
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
                    this.addImageFile(fileData.filePath, fileData.content, false);
                else
                    this.addFile(fileData.filePath, fileData.content, fileData.err, false);

            }
        
        }
    }

    window.onbeforeunload = function(event){
        viewStorage.setLastViewData();
        //event.returnValue = "終了してよろしいですか？" ;
    }

    /* dom setup */
    function initField(){

        for(var id=0; id<option.layoutCol; id++){

            _addOneFiledLayoutCol(id);
          
        } 

        lE0.show();
        getStyleData();

        if(isShow)
            lE0.show();
        else
            lE0.hide();
    }

    function _addOneFiledLayoutCol(colId){

        var canvasWidth = window.innerWidth - 22; 

         if(colId > 0){ 
          
            // separaor            
            (function(canvasId){
                var separator = _$_.create('div', `separator-${colId - 1}`, ['separator']);
                //setStyleElement(separator, 'left', `${100/layoutCol*(id+1)}%`);
                //separator.left = wid * (id + 1);
                //separator.position(wid * (id + 1));
                separatorList.push(separator);

                reviewCanvas.appendChild(separator);
                //sepParent.appendChild(separator);

                var mmove = function(e){
                    var canvasWidth = window.innerWidth - 22; 

                    var p = (e.clientX - lEsList[canvasId - 1].offset().left);
                    //p = p/reviewCanvas.offsetWidth*100.0;
                    if(canvasId == option.layoutCol - 1){
                        var p2 =  (styleData.reviewCanvas.left + reviewCanvas.innerWidth() - CanvasSepWid - e.clientX); 
                    } else {
                        var p2 =  (lEsList[canvasId + 1].offset().left - CanvasSepWid - e.clientX); 
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

                    lEsList[canvasId - 1].width = (p/canvasWidth * 100.0) + '%';
                    tabAriaList[canvasId - 1].width = (p + (canvasId - 1 > 0 ? CanvasSepWid - TabSepWid : 0)) / canvasWidth * 100.0 + '%';
                    lEsList[canvasId].width = (p2 / canvasWidth * 100.0) + '%';
                    tabAriaList[canvasId].width = (p2 + CanvasSepWid - TabSepWid) / canvasWidth * 100.0 + '%';

                    // resize callback
                    (function execResizeCallback(_canvasId){
                        
                        fileListLambda(function(fileId, fileData){
                            if(fileData.canvasId != _canvasId && fileData.canvasId != _canvasId - 1)
                                return ;

                            if(fileData.status != FILE_STATUS.SHOW)
                                return ;

                            if(fileData.callback && fileData.callback[FILE_CALLBACK_KEYS.RESIZE]){
                                fileData.callback[FILE_CALLBACK_KEYS.RESIZE]();
                            } 

                        });

                    })(canvasId);
                   
                    return false;
                }

                var mouseup = function(e){
                    document.removeEventListener('mousemove', mmove, false);
                    document.removeEventListener('mouseup', mouseup, false);
                    //setStyleElement(separator, 'left', `${e.clientX - reviewCanvas.getBoundingClientRect().left - 2}px`);
                    
                    // separator.css('left', `${lEsList[canvasId+1].offset().left - styleData.reviewCanvas.left - 2}px`);
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

            })(colId);

        }

        
        var lEs = _$_.create('div', `canvas-child-${colId}`, ['glsl-base-debug-files']);

        // # TODO 外側の margin-left + margin-right = 20 計算でだしたい
       
        var wid = (canvasWidth + CanvasSepWid) / option.layoutCol - CanvasSepWid; 
        lEs.width = (wid / canvasWidth * 100.0) + '%';
        
        lEsList.push(lEs);
        reviewCanvas.appendChild(lEs);

        var tabAria = _$_.create('ul', '', ['tabs-ul']);
        tabAriaList.push(tabAria);
        //setStyleElement(tabAria, 'width', `${100/layoutCol}%`);
        if(colId > 0)
            wid += CanvasSepWid - TabSepWid; 
        tabAria.width = (wid / canvasWidth * 100.0) + '%';

        tabAriaParent.appendChild(tabAria);

    }

    function changeFiledLayoutCol(newColNum) {
        var oldColNum = option.layoutCol;

        var canvasWidth = styleData.reviewCanvas.width;
        

        // column数が多い
        if(newColNum < oldColNum){
            
            var isSHowFileInNewColumn = hasOpenFile(newColNum - 1);
            // tab, file dom 移動
            fileListLambda(function(fileId, fileData){
                if(fileData.canvasId >= newColNum){
                    changeFilePosition(fileId, newColNum - 1);
                    if(isSHowFileInNewColumn && fileData.status == FILE_STATUS.SHOW)
                        setOneFileStatus(fileId, FILE_STATUS.HIDE);
                }
            });

            var removeWidth = 0;
            // 不要なparent 削除
            for(var colId = oldColNum - 1; colId >= newColNum; colId--){
                removeWidth +=  lEsList[colId].outerWidth()
                                + separatorList[colId - 1].outerWidth();

                tabAriaParent.removeChild(tabAriaList[colId]);
                reviewCanvas.removeChild(lEsList[colId]);
                reviewCanvas.removeChild(separatorList[colId - 1]);

                tabAriaList.pop();
                lEsList.pop();
                separatorList.pop();
            }

            // 現存するparent の幅調整
            for(var colId = 0; colId < newColNum; colId++){
                var wid1 = tabAriaList[colId].innerWidth();
                var wid2 = lEsList[colId].innerWidth();

                var widthP = wid1 / (canvasWidth - removeWidth);

                tabAriaList[colId].width =  widthP * 100.0 + '%';
                lEsList[colId].width =  widthP * 100.0 + '%';

            }

            option.layoutCol = newColNum;


        // column 数が少ない
        } else {

            option.layoutCol = newColNum;


            for(var colId = 0; colId < oldColNum; colId ++ ){
                var widP = lEsList[colId].outerWidth() / canvasWidth * oldColNum / newColNum;
                tabAriaList[colId].width = widP * 100.0 + '%';
                lEsList[colId].width = widP * 100.0 + '%';
            }

            for(var colId = oldColNum; colId < newColNum; colId ++ ){
                _addOneFiledLayoutCol(colId);
            }

        }
        
        

       
/*
        // dom 子要素削除
        
        reviewCanvas.empty();
        tabAriaParent.empty();

        for(var i=0; i<oldColNum; i++){
            lEsList[i].empty();
            tabAriaList[i].empty();
        }
        
        layoutCol = newColNum;

        initField();

        for(var i=0; i<oldColNum; i++){
            var fileData = getFileData(i+1);
            var colId = fileData.canvasId;
            if(colId > oldColNum){

            }
                fileData.tabElement

        }
*/
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
    function addFileAndtab(path, viewElement, canvasId = null, status = FILE_STATUS.SHOW, callback){

        var canvasId = appendlEsList(viewElement, canvasId);

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

        var fileId = addFileList(fileName, path, tabElement, viewElement, status, canvasId, callback);
        

        // hover 時にpath名表示
        (function setPathIndicatorListener(tab, tabElement){
            var isHovering = false;
            var requiredHoveringTime = 1000;
            
            tab.mouseover(function(e){
            
                if(isHovering)
                    return;

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
        (function setDragTabListener(tabC, tabElement, fileId){
            var isDragging = false;
            var tabDragOffsetTop = 0;
            var tabDragOffsetLeft = 0;
            var fileData = getFileData(fileId);
            
            function tabDrag(e){
                if(e.movementX == 0 && e.movementY == 0)
                return;  

                var canvasId = fileData.canvasId;
                var tabParent = tabAriaList[canvasId];

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

                var canvasId = fileData.canvasId;
                var tabParent = tabAriaList[canvasId];

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
                    var tabAriaId = 0;
                    var leftAccuulation = 11;
                    for(tabAriaId = 0; tabAriaId < tabAriaList.length; tabAriaId++){

                        leftAccuulation  += tabAriaList[tabAriaId].innerWidth() + TabSepWid;
                        if(e.clientX < leftAccuulation)
                            break;
                    }

                    changeFileStatus(fileId, FILE_STATUS.HIDE);
                    changeFilePosition(fileId, tabAriaId);
                    tabParent = tabAriaList[tabAriaId];
                    changeFileStatus(fileId, FILE_STATUS.SHOW);

                    if(fileData.viewElement[SCROLL_CONTROLLER_KEY])
                        fileData.viewElement[SCROLL_CONTROLLER_KEY].scrollCurrentPosition();

                    if(fileData.callback && fileData.callback[FILE_CALLBACK_KEYS.TAB_DRAG_END]){
                        fileData.callback[FILE_CALLBACK_KEYS.TAB_DRAG_END]();
                    }

                }
            }

            tabC.mousedown(function(e){
                

                _$_(document).mousemove(tabDrag, false);
                _$_(document).mouseup(tabDragEnd, false);

                changeFileStatus(fileId, FILE_STATUS.SHOW);

                tabDragOffsetLeft = e.offsetX; 
                tabDragOffsetTop = e.offsetY + 7; 
            });


        })(tabC1, tabElement, fileId);

      
        // file close
        tabC2.addEventListener('click', function(){
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

    function appendlEsList(elem, canvasId = null){
        if(canvasId == null){
        
            var smallestId = 0, smallestNum = 1000;
            for(var id=0; id<lEsList.length; id++){
                if(smallestNum > lEsList[id].children().length){
                    smallestNum = lEsList[id].children().length;
                    smallestId = id;
                }
            }
            canvasId = smallestId;
        
        } else if(canvasId >= lEsList.length){
        
            canvasId = lEsList.length - 1;
        
        }
            
        lEsList[canvasId].appendChild(elem);
        return canvasId;

    }

    function addFileList( fileName, path, tabElement, viewElement, status, canvasId = 0, callback = null){

        // #TODO ユニークな値をふる
        var fileId = fileList.length + 1;

        var fileData = {
            fileName: fileName,
            path: path,
            tabElement: tabElement,
            viewElement: viewElement,
            status: status,
            canvasId: canvasId,
            fileId: fileId,
            callback: callback
        };

        return fileList.push(fileData);
    }

    function getNextFileId(){
        return fileList.length + 1;
    }

    function getFileData(id){
        if(fileList.length < id)
            return null;

        return fileList[id - 1];
    }

    function fileListLambda(lambda){
        for(var fileId = 1; fileId < fileList.length + 1; fileId ++ ){
            if(lambda(fileId, getFileData(fileId)) === false)
                break;
        }
    }

    function changeFileStatus(fileId, status){

        var hasShowFile = status === FILE_STATUS.SHOW;
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
                fileData.tabElement.show('flex');
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

    function changeFilePosition(fileId, canvasId){

        var fileData = getFileData(fileId);
        
        if(!fileData)
            return false;

        var preCanvasId = fileData.canvasId;

        // dom 更新
        tabAriaList[preCanvasId].removeChild(fileData.tabElement);
        tabAriaList[canvasId].appendChild(fileData.tabElement);

        lEsList[preCanvasId].removeChild(fileData.viewElement);
        lEsList[canvasId].appendChild(fileData.viewElement);
    
        // data 更新
        fileData.canvasId = canvasId;

        return true;
    }

    function hasOpenFile(canvasId){

        var result = false;

        fileListLambda(function(fileId, fileData){
            if(fileData.canvasId == canvasId && fileData.status == FILE_STATUS.SHOW){
                result = true;
                return false;
            }
        });

        return result;
    
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

    function ScrollController(lE){
        
        var instance = this;
        this.sY = 0.0;

        var ticking = false, allShowState = 0;
        var lEchildrenLength = lE.children().length;
        var showLineNum = Math.ceil( styleData.reviewCanvas.height / lineHeight); // 40
        
        lE.addClass('scroll-performance');
        var start = 0;

        var maxId = showLineNum < lEchildrenLength ? showLineNum : lEchildrenLength;
        var end = maxId;

        for(var id=0; id < maxId; id++){
            _$_(lE.children()[id]).addClass('show');
        }
        
        lE.addEventListener('scroll', function(e) {
          instance.sY = lE.scrollTop;
            if (!ticking) {
                
                window.requestAnimationFrame(function() {

                    ticking = false;

                    //console.log(instance.sY);
                    var startId = Math.ceil(instance.sY / 15) - 1 ;
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

        this.scrollCurrentPosition = function(){
            this.scroll(this.sY);
        }

        this.scroll = function(value){
            lE.scrollTop = value;
        }

    }

    /* スタイルデータ取得 */
    function getStyleData () {

        var containerStyle = lE0.offset();
        styleData["container"] = {
            'left' : containerStyle.left,
            'top': containerStyle.top,
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
            'width': reviewCanvas.innerWidth(),
            'height': reviewCanvas.innerHeight()            
        };
    }

}
