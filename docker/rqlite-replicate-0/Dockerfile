FROM rqlite/rqlite:10.6.6

CMD ["rqlited", "-http-addr", "0.0.0.0:4001", "-http-adv-addr", "rqlite-replicate-0:4001", "-raft-addr", "0.0.0.0:4002", "-raft-adv-addr", "rqlite-replicate-0:4002", "-join", "http://rqlite-master:4001", "/rqlite/file/data"]
