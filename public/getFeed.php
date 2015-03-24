<?php 
    set_time_limit(20);                 // set time out of retrieving the feed to 20 seconds

    if( isset($_POST['feedUrl']) ) {    // if user submits a rss feed url
        error_reporting(0);             // supress all PHP errors in ajax response

        $userInput = trim( htmlspecialchars( $_POST['feedUrl'] ) );             // escape user input
        $content = (string) file_get_contents($userInput);                      // get feed content as string

        if ( is_numeric( strpos( $content, '<rss') ) ) {                        // if rss tag is found from user input...
            echo $content;                                                      // return content to Ajax request
        }
        else {                                                                  // else the url isn't a RSS XML file
            echo "feed not found...";                                           // print out error
        }        
    }               
?>