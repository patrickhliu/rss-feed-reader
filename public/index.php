<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8"> 
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>RSS Reader</title>
        <link href="css/normalize.css" rel="stylesheet" type="text/css">     
        <link href="css/style.css"     rel="stylesheet" type="text/css">
    </head>
    <body>
        <header>
            <h1><a href='index.php'>RSS Reader</a></h1>
        </header>

        <form method="POST" action="index.php" class="rss-url-form">
            <input type="url"    name='feedUrl' id="feedUrl" placeholder="enter rss url..." autofocus>
            <input type='submit' name='submit'  value='Get Feed' class = 'submit-btn'>
        </form>

        <h3 class="php-err noshow"></h3>

        <noscript>
            <div class="no-script">
            <p>Note: Please enable Javascript</p>
            </div>
        </noscript>

        <div class='per-page-container'>
            <label for="per-page"   class = "noshow"># of articles per page:</label>
            <select id = "per-page" class = "noshow">
                <option value = '5' selected>5</option>
                <option value = '10'>10</option>
                <option value = '15'>15</option>
                <option value = '20'>20</option>
                <option value = '25'>25</option>
                <option value = '30'>30</option>
                <option value = '35'>35</option>
                <option value = '40'>40</option>
                <option value = '45'>45</option>
                <option value = '50'>50</option>
            </select>
        </div>
    
        <section class = "feed-section">
        </section>

        <script src="js/script.js" type="text/javascript"></script>
    </body>
</html>