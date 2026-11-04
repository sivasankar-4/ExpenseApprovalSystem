package com.siva.expense_approval_system.infrastructure.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.siva.expense_approval_system.domain.model.User;
import com.siva.expense_approval_system.domain.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service

@RequiredArgsConstructor

//UserDetailService now the spring says that give me any class that implements this interface i replied as CustomerUserDeatilsService
public class CustomUserDetailsService implements UserDetailsService{
    
     private final UserRepository userRepository;
    
     @Override
     public UserDetails loadUserByUsername(String username)
      
     throws UsernameNotFoundException {

         User user = userRepository.findByEmail(username)
                     .orElseThrow(() -> new UsernameNotFoundException("User not found with Email:" + username));

        return new CustomUserDetails(user); //it obtained or loads from the database
     }
}
//what happens if a login request its job is to load the user from the database and convert it into a UserDetails

//loadUserByUsername("siva@gmail.com") -> UserRepository.findByEmail("siva@gmail.com") -> user Entity -> CustomUserDetails -> return to AuthenticationProvider