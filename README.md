# PhishFinder

URL threat analysis service that scans links through multiple security engines to detect phishing and malicious content.




## thinking out loud: features
i am thinking on the website where people would do phishing websites search, i will probably add a counter to show how many searches has been found.

i also think i should have a way for people to add to the phishing list for my model to validate too, and train with. like a `submit phishing site` button.


## random finds

https://www.phishtank.com/


## random workups 

initially i was thinking i will find one pre-set dataset on kaggle to use that has legit and phishing separately. but clearly right now i found something else the [PhiUSiil dataset](ttps://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset). Will use that, so i will adjust the data preprocessing script. 

i tried to run the script without training the model with the dataset, so i am going to train it first. fuck me for not remembering. 