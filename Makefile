SEC=secure.json

.PHONY: run clean


run: secure.json
	@docker images | grep -q "jiffy-to-tks" || docker build -t jlabusch/jiffy-to-tks .
	@docker run -it --rm $${NET_ARGS---net host} $$MORE_RUN_ARGS -v $$PWD:/opt jlabusch/jiffy-to-tks make __run

__run:
	@test -d node_modules || npm install
	@node ./jiffy-to-tks.js Jiffy*.csv | tee timesheet.txt && echo "Saved timesheet.txt"

clean:
	rm -f timesheet.txt secure.json

$(SEC): $(SEC).pgp
	gpg --yes -d -o $@ $<

secure: $(SEC)
	gpg --yes -sac -o $(SEC).pgp $<

