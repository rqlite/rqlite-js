FROM rqlite/rqlite:10.6.6

CMD ["rqlited", "-http-addr", "0.0.0.0:4001", "-http-adv-addr", "rqlite-master:4001", "-raft-addr", "0.0.0.0:4002", "-raft-adv-addr", "rqlite-master:4002", "/rqlite/file/data"]
