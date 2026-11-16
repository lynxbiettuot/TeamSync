package com.springrest.backend.dto.chat.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallSignalDTO {
    private String type;

    @JsonProperty("senderId")
    @JsonAlias({"sender_id", "senderId"})
    private Integer senderId;

    @JsonProperty("callerId")
    @JsonAlias({"caller_id", "callerId"})
    private Integer callerId;

    @JsonProperty("callerName")
    @JsonAlias({"caller_name", "callerName"})
    private String callerName;

    @JsonProperty("callerAvatar")
    @JsonAlias({"caller_avatar", "callerAvatar"})
    private String callerAvatar;

    @JsonProperty("receiverId")
    @JsonAlias({"receiver_id", "receiverId"})
    private Integer receiverId;

    @JsonProperty("callType")
    @JsonAlias({"call_type", "callType"})
    private String callType;

    private Object sdp;

    private Object candidate;

    private String reason;
}