setup:
	mkdir -p dist
	ln -s ../images dist/images
	ln -s ../assets dist/assets
	cd dist; ruby -run -ehttpd . -p8000 &
	gp url 8000 > dist/website.url
	tweego --watch -o dist/index.html -m modules src	

stop:
	killall ruby

dev: 
	tweego --watch -o dist/index.html -m modules src

build:
	mkdir dist
	cp -R images dist/
	cp -R assets dist/
	tweego -o dist/index.html -m modules src

ci-build:
	mkdir dist
	cp -R images dist/
	cp -R assets dist/
	ci/tweego -o dist/index.html -m modules src