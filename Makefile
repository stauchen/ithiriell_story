setup:
	mkdir -p dist
	ln -s ../images dist/images
	cd dist; ruby -run -ehttpd . -p8000 &
	gp url 8000 > dist/website.url
	tweego --watch -o dist/index.html -m modules src	
stop:
	killall ruby
dev: 
	tweego --watch -o dist/index.html -m modules src
build:
	tweego -o dist/index.html -m modules src