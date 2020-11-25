setup:
	mkdir -p dist
	ln -s images dist/images
	tweego -o dist/index.html -m modules src	
dev: 
	tweego --watch -o dist/index.html -m modules src
build:
	tweego -o dist/index.html -m modules src