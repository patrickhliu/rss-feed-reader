/***********************************************
script.js -- All code is in Vanilla Javascript
***********************************************/
var feedSection = document.querySelector('.feed-section');      // variable for the div containing all feed info
var perPageMenu = document.querySelector('#per-page');          // the container of the articles/page drop down menu
var rssForm = document.querySelector('.rss-url-form');

var parser;                                                     // variable for rss xml parser
var currentPage = 1;                                            // default to page 1 on each page load
var pageLinkArr = [];                                           // array container for all page link anchor elements
var epPerPage = perPageMenu.value;                              // store the current value from drop down menu
var feedUrl;

/********** Event Handlers **********/
rssForm.addEventListener('submit', function(e) {                // form submission event handler
    e.preventDefault();                                         // prevent default POST
    currentPage = 1;                                            // re-initialize variables for new RSS feed submission
    pageLinkArr = [];
    epPerPage = perPageMenu.value;
    feedUrl = document.querySelector('#feedUrl').value;         // the rss url entered by user
    document.querySelector('label').classList.add('noshow');    // hide drop down menu for articles/page
    document.querySelector('select').classList.add('noshow');
    feedErrorDisplay(false);                                    // hide the error message container
    feedSection.innerHTML = '';                                 // remove previously shown feed articles
    callAjax(parseXML, 'getFeed.php', 'feedUrl=' + feedUrl);    // ajax call to display feed articles
})

// event handler for when user adjusts the "articles/page" setting in the drop down menu
perPageMenu.addEventListener('change', function () {
    epPerPage = parseInt(this.value);      // update variable
    feedSection.innerHTML = '';            // remove previously shown feed articles
    callAjax(parseXML, 'getFeed.php', 'feedUrl=' + feedUrl);
})

// pageLinkHandlers() will add a click event handler to each next/previous page link shown
function pageLinkHandlers() {
    for (var i = 0; i < pageLinkArr.length; i++) {              // loop through array 
        pageLinkArr[i].addEventListener('click', function() {  
            currentPage = parseInt(this.getAttribute('data-page').replace('p', ''));   // extract page # from anchor link id and store to currentPage
            feedSection.innerHTML = '';                         // remove previously shown feed articles
            callAjax(parseXML, 'getFeed.php', 'feedUrl=' + feedUrl);
        })
    }
}

/********** Helper Functions **********/
// function to show/hide error message on ajax call of Rss feed
function feedErrorDisplay(choice, content) {
     if (choice) {  // if true, display the error message
        document.querySelector('.php-err').innerHTML = content;
        document.querySelector('.php-err').classList.remove('noshow');

     }
     else { // if false, hide the error message
        document.querySelector('.php-err').classList.add('noshow');  
     }
}

// doesPropertyExist() is a helper function that verifies 
// if a property exists in the feed XML (eg: title, description, mp3 link, etc...)
function doesPropertyExist(browser, elem, prop) {
    // With IE, you can directly search for the property
    if ( browser === 'IE') {  
        // if property isn't there, return false.  else return true.
        return (elem.querySelector(prop) === null || elem.querySelector(prop).length == 0) ?  false : true;  
    }
    // In ff/chrome, must search through "children" nodelist to find the property
    else {
        for ( var a = 0; a < elem.children.length; a++ ) {  // loop through the children node
            if ( elem.children[a].nodeName === prop ) {     // if property found, return the index of children nodelist
                return a;
            }
        }
        return false;                                       // else not found, return false
    }
}

// newElem() is a helper function to create new DOM elements & return them
function newElem( elemType, elemHref, elemData, elemText, elemClass, elemHTML ) {
    var newElem = document.createElement(elemType);

    // if function was passed a href attribute, set it
    if (elemHref) {
        newElem.setAttribute('href', elemHref);
    }

    // if function was passed a id attribute, set it
    if (elemData) {
        newElem.setAttribute('data-page', elemData);
    }

    // if function was passed innerText content, set it
    if (elemText) {
        newElem.textContent = elemText;
    }

    // if function was passed a class attribute, set it
    if (elemClass) {
        newElem.setAttribute('class', elemClass);
    }

    // if function was passed innerHTML, set it
    if (elemHTML) {
        newElem.innerHTML = elemHTML;
    }

    // return the new element to caller function
    return newElem;
}

/********** Program Flow **********/

// callAjax() will make ajax request
// arguments: a callback function, url is a php file to send the post request, sendData is the rss url
function callAjax (callback, url, sendData) {
    var req = new XMLHttpRequest();
    
    req.onreadystatechange = function() {
        if (req.readyState === 4 && req.status === 200) {
            if ( (req.responseText.length > 0) & (req.responseText.indexOf('<rss') !== -1)  ) {     // verify xml file isn't empty & has rss tag
                callback(req.responseText);                                                         // callback is parseXML() to parse the feed
                document.querySelector('label').classList.remove('noshow');                         // display drop down menu for articles/page
                document.querySelector('select').classList.remove('noshow'); 
            }
            else {      // feed is invalid
                var errorAnchor = '<a href=' + feedUrl + '>' + feedUrl + '</a>';            
                var errorParagraph = '<p>Sorry, this feed can\'t be found.  Please check url...</p>';
                feedErrorDisplay(true, errorAnchor + errorParagraph);                       // create error message, display it
            }
        } 
    }
    req.open("POST", url, true);                                                            // send POST request
    req.setRequestHeader("Content-Type","application/x-www-form-urlencoded");
    req.send(sendData);
}

// function to parse the local XML file
function parseXML (response) {                                  // once ajax request is successful, pass in the reponseXML here
    if (window.DOMParser) {                                     // if browser is not IE
        parser = new DOMParser();                               // create parser object
        var doc = parser.parseFromString(response,"text/xml");  // create XMl document from ajax responseXML
     }
    else {                                                      // if browser is IE
        var doc = new ActiveXObject("Microsoft.XMLDOM");        // create XML document from ajax responseXML
        doc.async=false;
        doc.loadXML(response);
    } 

    var feedTitle = doc.querySelector('channel').querySelector('title').textContent;                // extract feed title
    var feedLink  = doc.querySelector('channel').querySelector('link:not([href])').textContent;     // extract feed web page link
    var episodes  = doc.querySelector('channel').querySelectorAll('item');                          // extract all articles
    var numEp     = episodes.length;                                                                // calculate total # of articles
    var startIndex = (currentPage * epPerPage) - epPerPage;                                         // calculate for-loop start index
    var endIndex   = (currentPage * epPerPage);                                                     // calculate for-loop end index
    var lastPage   = Math.ceil(episodes.length / epPerPage);                                        // calculate last page

    // call makeHeader() to create the DOM header for the feed
    makeHeader(feedTitle, feedLink, numEp, lastPage);   
    
    // call looper() to loop & create a DOM container for each article in the XML feed
    looper(currentPage, episodes, startIndex, endIndex, lastPage, numEp);
}

// makeHeader will create a header on the page for the XML feed
function makeHeader(title, link, numEp, lastPage) {
    if ( currentPage > lastPage ) {
        currentPage = lastPage;
    }

    var anchorTag = newElem('a', link, false, title, false, false);     // create anchor tag to link to feed's main web site

    var newHeader1 = newElem('h1', false, false, false, false, false);  // insert anchor into an h1
    newHeader1.appendChild(anchorTag);

    // create h4 to store # of articles & # of pages information
    var newHeader4 = newElem('h4', false, false, numEp + ' articles / Page ' + currentPage + ' of ' + lastPage, false, false);

    // append h1 & h4 to the feed section div
    feedSection.appendChild(newHeader1);
    feedSection.appendChild(newHeader4);
}

// looper() loops through the "items" node of the feed and parses out article info
function looper(currentPage, episodes, startIndex, endIndex, lastPage, numEp) {
    var epTitle, epPageLink, epDesc, epDate, epMP3, epIndex;
    
    // if end index > than # of articles...(looking for article # that doesn't exist)
    // eg: we were on last page, user changes articles/page setting such that this last page doesn't exist anymore...
    // then update a few variables..
    if ( endIndex > numEp ) {
        endIndex = numEp;
        //currentPage = lastPage  //makeHeader() already sets this so heading will display correct info
        startIndex = (currentPage * epPerPage) - epPerPage;
    }

    // if current page is larger than last page, makeHeader() will set current = last
    // same situation as above...
    // here need to recalculate start index to start on the "new" last page
    //if ( currentPage = lastPage ) {
        //currentPage = lastPage;
        //startIndex = (currentPage * epPerPage) - epPerPage;
    //}

    // loop through the "items" node of the feed and extract information
    for (var i = startIndex; i < endIndex; i++) {
        // if browser is IE...use short-circuit statements to extract each piece of info
        if ( navigator.userAgent.indexOf('Trident') !== -1)  {  
            epTitle     = doesPropertyExist('IE', episodes[i], 'title')      && episodes[i].querySelector('title').textContent;
            epDesc      = doesPropertyExist('IE', episodes[i], 'description')&& episodes[i].querySelector('description').textContent;
            epPageLink  = doesPropertyExist('IE', episodes[i], 'link')       && episodes[i].querySelector('link').textContent;
            epDate      = doesPropertyExist('IE', episodes[i], 'pubDate')    && episodes[i].querySelector('pubDate').textContent;
            epMP3       = doesPropertyExist('IE', episodes[i], 'enclosure')  && episodes[i].querySelector('enclosure').getAttribute('url');         
            epSize      = doesPropertyExist('IE', episodes[i], 'enclosure')  && 
                          episodes[i].querySelector('enclosure').getAttribute('length').length > 0 &&
                          Math.floor(episodes[i].querySelector('enclosure').getAttribute('length') / (1024 * 1024) );           

            // makeEpDiv() to create the DOM element to store all this information
            makeEpDiv(epTitle, epDesc, epPageLink, epDate, epMP3, epSize);
        }
        // if browser is not IE...use ternary statements to extract each piece of info
        else {
            epIndex     = doesPropertyExist('notIE', episodes[i], 'title') ; 
            epTitle     = typeof epIndex === 'number'  ?  episodes[i].children[epIndex].textContent : false;

            epIndex     = doesPropertyExist('notIE', episodes[i], 'description') ;
            epDesc      = typeof epIndex === 'number'  ?  episodes[i].children[epIndex].textContent : false;

            epIndex     = doesPropertyExist('notIE', episodes[i], 'link') ;
            epPageLink  = typeof epIndex === 'number'  ?  episodes[i].children[epIndex].textContent : false;

            epIndex     = doesPropertyExist('notIE', episodes[i], 'pubDate') ;
            epDate      = typeof epIndex === 'number'  ?  episodes[i].children[epIndex].textContent : false;

            epIndex     = doesPropertyExist('notIE', episodes[i], 'enclosure') ;
            epMP3       = typeof epIndex === 'number'  ?  episodes[i].children[epIndex].outerHTML : false;
            epMP3       = typeof epMP3   === 'string'  ?  epMP3.substring( epMP3.search("http"), epMP3.lastIndexOf(".mp3") ) + '.mp3' : false;          
            epSize      = typeof epIndex === 'number'  ?  episodes[i].children[epIndex].outerHTML : false;
            epSize      = typeof epSize  === 'string'  ?  epSize.match(/length="\d+/) : false;
            epSize      = epSize  !== null  ?  epSize[0] : false;
            epSize      = typeof epSize  === 'string'  ?  epSize.replace(/length="/, '') : false;
            epSize      = typeof epSize  === 'string'  ?  parseInt(epSize.replace(/length="/, '')) : false;
            epSize      = typeof epSize  === 'number'  ?  Math.floor(epSize/(1024*1024)) : false;           
            
            // makeEpDiv() to create the DOM element to store all this information
            makeEpDiv(epTitle, epDesc, epPageLink, epDate, epMP3, epSize);          
        }
    }

    // makePageLinks() will create the DOM container that holds anchor links for next/previous pages
    makePageLinks(currentPage, lastPage);
}

// makeEpDiv creates a div to store information for each article in the feed
function makeEpDiv(title, desc, pagelink, date, mp3, size) {
    var epDiv = document.createElement('div');
    epDiv.setAttribute('class', 'ep-div');

    // if any of the arguments aren't passed as false, then create an element for 
    // that argument and append it to the article div (epDiv)
    if ( title ) {
        var newHeader = newElem('h3', false, false, title, false, false);
        epDiv.appendChild(newHeader);   
    }
    
    if (date) {
        var newParagraph = newElem('p', false, false, date, false, false);
        epDiv.appendChild(newParagraph);    
    }

    if (desc) {
        var newParagraph = newElem('p', false, false, false, 'ep-desc', desc);
        epDiv.appendChild(newParagraph);
    }

    if (mp3) {
        var newAudio = newElem('audio', false, false, false, 'ep-audio', false);
        newAudio.src = mp3;
        newAudio.controls = true;
        newAudio.preload = 'none';
        newAudio.volume = 0.1;
        epDiv.appendChild(newAudio);    
    }
    
    if (pagelink) {
        var newAnchor = newElem('a', pagelink, false, 'Page Link', false, false);
        epDiv.appendChild(newAnchor);   
    }

    if ( mp3 && size) {
        var newAnchor = newElem('a', mp3, false, 'Download File [' + size + ' mb]', false, false);
        epDiv.appendChild(newAnchor);
    }
    else if ( mp3 && !size) {
        var newAnchor = newElem('a', mp3, false, 'Download File [unknown size]', false, false);
        epDiv.appendChild(newAnchor);
    }

    feedSection.appendChild(epDiv);     // append to feed section div (main container)
}

// makePageLinks() creates the anchor links for previous & next pages
function makePageLinks (currentPage, lastPage) {
    var newDiv = document.createElement('div');
    newDiv.classList.add('page-links-container');
    
    // when user is on a page that is > last page of feed (it shouldn't exist)...
    if (currentPage > lastPage) {
        currentPage = lastPage;
    }

    // when user is on page 1...
    if (currentPage === 1) {
        pageLinkArr = [];      // clear out page link array

        // Create anchor links for pages 1 - 3
        for (var a = 0; a < 3; a++)  {              // cycle through pages 1, 2, 3
            if ( (currentPage + a) <= lastPage) {   // if those pages are <= last page... create the link
                if( (currentPage + a) === currentPage ) {   // if you're currently on that page, highlight it with brackets & css class
                    var newAnchor = newElem('a', '#', 'p' + (currentPage + a), '[' + parseInt(currentPage + a) + ']', 'highlight-page', false);
                }
                else {                                      // else just use the # as the text content
                    var newAnchor = newElem('a', '#', 'p' + (currentPage + a), currentPage + a, false, false);
                }               
                
                pageLinkArr.push(newAnchor);        // push new anchor link to array
                newDiv.appendChild(newAnchor);      // append to the page links container div
            }
        }
        
        // Create anchor link for "next page"
        if ( (currentPage + 1) <= lastPage) {       // verify next page is <= last page then create the anchor element
            var newAnchor = newElem('a', '#', 'p' + (currentPage + 1), 'Next', false, false);
            pageLinkArr.push(newAnchor);
            newDiv.appendChild(newAnchor);
        }       
        
        // call to add click event handlers
        pageLinkHandlers();
    }
    // when user is on the last page of the feed
    else if (currentPage === lastPage) {
        pageLinkArr = [];   // clear out page link array
        
        // Create anchor link for "previous page"
        if ((lastPage - 1) >= 1) {  // if previous page is >= 1, then create the anchor link
            var newAnchor = newElem('a', '#', 'p' + (lastPage - 1), 'Prev', false, false);
            pageLinkArr.push(newAnchor);
            newDiv.appendChild(newAnchor);  
        }

        // Links for (lastPage -1) & lastPage
        for (var a = 1; a >= 0; a--)     {  // cycle through both
            if ((lastPage - a) >= 1 ) {     // if they're >= 1, create the anchor link
                if( (lastPage - a) === currentPage ) {
                    var newAnchor = newElem('a', '#', 'p' + (lastPage - a), '[' + parseInt(lastPage - a) + ']', 'highlight-page', false);
                }
                else {
                    var newAnchor = newElem('a', '#', 'p' + (lastPage - a), lastPage - a, false, false);
                }
                
                pageLinkArr.push(newAnchor);        // push new anchor link to array
                newDiv.appendChild(newAnchor);      // append to the page links container div
            }               
        }

        // call to add click event handlers
        pageLinkHandlers();
    }
    // when user is on a page in the middle (not first, not last)
    else {
        pageLinkArr = [];       // clear out page link array

        // Create anchor link for "previous page"
        if ((currentPage - 1) >= 1) {   // if it's >= 1, create the anchor link
            var newAnchor = newElem('a', '#', 'p' + (currentPage - 1), 'Prev', false, false);
            pageLinkArr.push(newAnchor);
            newDiv.appendChild(newAnchor);
        }
        
        // Create anchor links for (currentPage-1) & currentPage & (currentPage+1)
        for (var a = 1; a >= -1; a--)    {  // loop through all 3
            if( (currentPage - a) === currentPage ) {   // if user is on that page, highlight with brackets & css class
                var newAnchor = newElem('a', '#', 'p' + (currentPage - a), '[' + parseInt(currentPage - a) + ']', 'highlight-page', false);
            }
            else {                                      // else insert page # as text content
                var newAnchor = newElem('a', '#', 'p' + (currentPage - a), currentPage - a, false, false);
            }   
            
            pageLinkArr.push(newAnchor);        // push new anchor link to array
            newDiv.appendChild(newAnchor);      // append to the page links container div
        }

        // Create anchor link for "next page"
        if ( (currentPage + 1) <= lastPage) { // if it's <= last page of feed, create the anchor link
            var newAnchor = newElem('a', '#', 'p' + (currentPage + 1), 'Next', false, false);
            pageLinkArr.push(newAnchor);
            newDiv.appendChild(newAnchor);
        }

        // call to add click event handlers
        pageLinkHandlers();
    }

    // finally append this new div of page links to the main feed section div
    feedSection.appendChild(newDiv);
}