package spa;

/**
 * (c) 2011 Arkadiusz Orzechowski
 * (c) 2014 Joel Kuiper
 *
 * This file was adapted from ZGuide
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


/**
 * Majordomo Protocol Client API, asynchronous Java version. Implements the
 * MDP/Worker spec at http://rfc.zeromq.org/spec:7.
 */
public class Client {

    private String broker;
    private ZContext ctx;
    private ZMQ.Socket client;
    private long timeout = 10000;


    public long getTimeout() {
        return timeout;
    }

    public void setTimeout(long timeout) {
        this.timeout = timeout;
    }

    public Client(String broker) {
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
        client = ctx.createSocket(ZMQ.DEALER);
        client.setLinger(0);
        client.connect(broker);
    }

    /**
     * Returns the reply message or NULL if there was no reply. Does not attempt
     * to recover from a broker failure, this is not possible without storing
     * all unanswered requests and resending them all…
     */
    public ZMsg recv() {
        ZMsg reply = null;

        // Poll socket for a reply, with timeout
        ZMQ.Poller items = new ZMQ.Poller(1);
        items.register(client, ZMQ.Poller.POLLIN);
        if (items.poll(timeout * 1000) == -1) {
            return null; // Interrupted
        }

        if (items.pollin(0)) {
            ZMsg msg = ZMsg.recvMsg(client);
            // Don't try to handle errors, just assert noisily
            assert (msg.size() >= 4);

            ZFrame empty = msg.pop();
            assert (empty.getData().length == 0);
            empty.destroy();

            ZFrame header = msg.pop();
            assert (MDP.C_CLIENT.equals(header.toString()));
            header.destroy();

            ZFrame replyService = msg.pop();
            replyService.destroy();

            reply = msg;
        }
        return reply;
    }

    /**
     * Send request to broker and get reply by hook or crook Takes ownership of
     * request message and destroys it when sent.
     */
    public void send(String service, byte[] id, ZMsg request) {
        assert (request != null);

        // Prefix request with protocol frames
        // Frame 0: empty (REQ emulation)
        // Frame 1: "MDPCxy" (six bytes, MDP/Client x.y)
        // Frame 2: Service name (printable string)
        // Frame 3: Request id
        request.addFirst(id);
        request.addFirst(service);
        request.addFirst(MDP.C_CLIENT.newFrame());
        request.addFirst("");
        request.send(client);
    }

    public void destroy() {
        ctx.destroy();
    }
}
