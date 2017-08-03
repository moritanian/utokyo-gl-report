 /*  
    mini_query
    dom操作系 
     #TODO 複数ノード対応    
 */

var _$_ = (function(){

    var constructer = function(s){
        var ins = new _$_(s);
        return ins;
    }

    var _$_ = function(s){
        if(s instanceof Element || s instanceof HTMLDocument)
            this.element = s;
        else if(typeof s === "string"){
            if(!s)
                return
            if(s[0] === '#')
                this.element = document.getElementById(s.slice(1));
            else if(s[0] === '.')
                this.element = document.getElementsByClassName(s.slice(1));
            else if(s === 'body')
                this.element = document.body;
        }
    };

    _$_.prototype = {
       
        /* dom ツリー操作 */
        prependChild: function(el){
            this.element.insertBefore(el.element, this.element.firstChild);
            return this;
        },

        appendChild: function(el){
            this.element.appendChild(el.element);
            return this;
        },

        removeChild: function(el){
            this.element.removeChild(el.element);
            return this;
        },

        empty: function(){
            var childrenElements = this.children();
            for(var i=0; i<childrenElements.length; i++)
                this.element.removeChild(childrenElements[i]);
        },

        children: function(index){
            if(index === undefined)
                return this.element.childNodes;
            return constructer(this.element.childNodes[index]);
        },

        get: function(id){
            return this.element;
        },

        /* 表示 */
        show: function(s = 'block'){
            this.element.style.display = s;
            return this;
        },

        hide: function(){
            this.element.style.display = 'none';
            return this;
        },

        position: function(x, y){
            this.css('left', `${x}px`);
            this.css('top', `${y}px`);
            return this;
        },

        css: function(key, value){
            this.element.style[key] = value;
            return this;
        },

        addClass: function(_class){
            this.element.classList.add(_class);
            return this;
        },

        /* 属性操作 */
        removeClass: function(_class){
            this.element.classList.remove(_class);
            return this;
        },

        hasClass: function(_class){
             return this.element.classList.contains(_class);
        },

        attr: function(attr, value){
            if(value){
                this.element.setAttribute(attr, value);
                return this;
            } else {
                return this.element.getAttribute(attr);
            }
        },

        addId: function(id){
            return this.attr('id', id);
        },

        clone: function(){
            return constructer(this.element.cloneNode());
        },

        offset: function(){ 
            return this.element.getBoundingClientRect();
        },

        // width + padding
        innerWidth: function(){
            return this.element.clientWidth;
        },

        innerHeight: function(){
            return this.element.clientHeight;
        },

        // width + padding + border
        outerWidth: function(){
            return this.element.offsetWidth;
        },

        outerHeight: function(){
            return this.element.offsetHeight;
        },

        /* event handler */
        scrollTop: function(v){
            if(v === undefined)
                return this.element.scrollTop;

            this.element.scrollTop = v;
            return this;
        },

        hasScrollBar: function() {
            return this.element.scrollHeight > this.innerHeight();
        },

        addEventListener: function(event, func, b = false){
            this.element.addEventListener(event, func, b);
            return this;
        },

        click: function(func, b = false){
            return this.addEventListener('click', func, b);
        },

        mousedown: function(func, b = false){
            return this.addEventListener('mousedown', func, b);
        },

        mouseup: function(func, b = false){
            return this.addEventListener('mouseup', func, b);
        },

        mousemove: function(func, b = false){
            return this.addEventListener('mousemove', func, b);
        },

        mouseout: function(func, b = false){
            return this.addEventListener('mouseout', func, b);
        },

        mouseover: function(func, b = false){
            return this.addEventListener('mouseover', func, b);
        },

        mouseenter: function(func, b = false){
            return this.addEventListener('mouseenter', func, b);
        },

        mouseleave: function(func, b = false){
            return this.addEventListener('mouseleave', func, b);
        },

        hover: function(inFunc, outFunc, b){
            this.mouseover(inFunc, b);
            this.mouseout(outFunc, b);
            return this;
        },

        /* text 類 */
        text: function(t){
            if(t === undefined)
                return this.element.textContent;
            else
                this.element.textContent = t;
            return this;
        },

        html: function(t){
            if(t === undefined)
                return this.element.innerHTML;
            else
                this.element.innerHTML = t;
            return this;

        }
    }

    Object.defineProperty(_$_.prototype, "width", {
        get: function width() {
            return document.defaultView.getComputedStyle(this.element, null).width;
        },
        set: function width(w){
            if(typeof w === "number")
                this.css('width', w + 'px');
            else 
                this.css('width', w);
        }
    });

    Object.defineProperty(_$_.prototype, "height", {
        get: function height() {
            return document.defaultView.getComputedStyle(this.element, null).height;
        },
        set: function height(h){
            if(typeof h === "number")
                this.css('height', h + 'px');
            else 
                this.css('height', h);
        }
    });

    Object.defineProperty(_$_.prototype, "scrollTop", {
        get: function scrollTop() {
            return this.element.scrollTop;
        },
        set: function scrollTop(v){
            if((typeof v) === "number")
                this.element.scrollTop = v;
            else 
                console.warn('mini_query: Cannot use non numeric value in element.scrollTop');
        }
    });


    constructer.create = function(tag, id, classes){
        var elem = document.createElement(tag);
        var ins = constructer(elem);
        if(id)
            ins.addId(id);

        for(var i in classes){
            ins.addClass(classes[i]);
        }

        return ins;
    }

    return constructer;
})();
