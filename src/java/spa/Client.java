package spa;

/**
 * This file is part of ZGuide
 *
 * ZGuide is free software; you can redistribute it and/or modify it under
 * the terms of the Lesser GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * ZGuide is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * Lesser GNU General Public License for more details.
 *
 * You should have received a copy of the Lesser GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import spa.MDP;

import org.zeromq.ZContext;
import org.zeromq.ZFrame;
import org.zeromq.ZMQ;
import org.zeromq.ZMsg;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Majordomo Protocol Client API, Java version Implements the MDP/Worker spec at
 * http://rfc.zeromq.org/spec:7.
 *
 */
public class Client {

    private String broker;
    private ZContext ctx;
    private ZMQ.Socket client;
    private long timeout = 2500;
    private int retries = 3;
    private boolean verbose;

    private Logger log = LoggerFactory.getLogger(Client.class);

    public long getTimeout() {
        return timeout;
    }

    public void setTimeout(long timeout) {
        this.timeout = timeout;
    }

    public int getRetries() {
        return retries;
    }

    public void setRetries(int retries) {
        this.retries = retries;
    }

    public Client(String broker) {
        log.info("Connecting a client to " + broker);
        this.broker = broker;
        ctx = new ZContext();
        reconnectToBroker();
    }

    /**
     * Connect or reconnect to broker
     */
    private void reconnectToBroker() {
        if (client != null) {
            ctx.destroySocket(client);
        }
        client = ctx.createSocket(ZMQ.REQ);
        client.connect(broker);
        log.debug("Connecting to broker at " + broker);
    }

    /**
     * Send request to broker and get reply by hook or crook Takes ownership of
     * request message and destroys it when sent. Returns the reply message or
     * NULL if there was no reply.
     *
     * @param service
     * @param request
     * @return
     */
    public ZMsg send(String service, ZMsg request) {

        request.push(new ZFrame(service));
        request.push(MDP.C_CLIENT.newFrame());
        log.debug("Send request to " + service + " service");
        ZMsg reply = null;

        int retriesLeft = retries;
        while (retriesLeft > 0 && !Thread.currentThread().isInterrupted()) {

            request.duplicate().send(client);

            // Poll socket for a reply, with timeout
            ZMQ.Poller items = new ZMQ.Poller(1);
            items.register(client, ZMQ.Poller.POLLIN);
            if (items.poll(timeout) == -1)
                break; // Interrupted

            if (items.pollin(0)) {
                ZMsg msg = ZMsg.recvMsg(client);
                if (verbose){
                    log.debug("Received reply");
                    //msg.dump(log.out());
                }
                // Don't try to handle errors, just assert noisily
                assert (msg.size() >= 3);

                ZFrame header = msg.pop();
                assert (MDP.C_CLIENT.equals(header.toString()));
                header.destroy();

                ZFrame replyService = msg.pop();
                assert (service.equals(replyService.toString()));
                replyService.destroy();

                reply = msg;
                break;
            } else {
                items.unregister(client);
                if (--retriesLeft == 0) {
                    log.error("Permanent error, abandoning");
                    break;
                }
                log.warn("No reply, reconnecting");
                reconnectToBroker();
            }
        }
        request.destroy();
        return reply;
    }

    public void destroy() {
        log.warn("Destroying client session");
        ctx.destroy();
    }
}
